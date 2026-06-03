import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const tok = (p) => new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
const ok = (l, c) => { console.log(`${c ? "✅" : "❌"} ${l}`); return c; };
const bad = (t) => t.includes("Internal Server Error") || t.includes("could not be found") || t.includes("Application error");
let all = true;

const u = await prisma.user.findMany({ include: { student: true, teacher: true } });
const noa = u.find((x) => x.email === "noa@student.il");
const yael = u.find((x) => x.email === "yael@student.il");
const dana = u.find((x) => x.email === "dana@school.il");
const admin = u.find((x) => x.role === "ADMIN" && !x.archived_at) || u.find((x) => x.role === "ADMIN");

const get = async (path, user) => {
  const t = await tok({ userId: user.id, role: user.role, name: user.full_name, mustChangePassword: false });
  const r = await fetch("http://localhost:3000" + path, { headers: { cookie: `session=${t}` } });
  return { s: r.status, t: await r.text() };
};

let r = await get("/student", noa);
all &= ok("student dashboard (noa) 200 + progress meter", r.s === 200 && r.t.includes("מד התקדמות") && !bad(r.t));

r = await get("/student", yael);
all &= ok("student dashboard (yael י\"ב) shows bagrut + trophy", r.s === 200 && r.t.includes("בגרות חברתית") && !bad(r.t));

r = await get("/teacher", dana);
all &= ok("teacher dashboard 200 + progress column", r.s === 200 && r.t.includes("התקדמות") && !bad(r.t));

r = await get("/admin", admin);
all &= ok("admin dashboard 200 + progress column", r.s === 200 && r.t.includes("התקדמות") && !bad(r.t));

r = await get("/admin/data", admin);
all &= ok("admin/data 200 + year transition button", r.s === 200 && r.t.includes("העברת שנה") && !bad(r.t));

r = await get(`/admin/student/${yael.student.id}`, admin);
all &= ok("student card (yael) shows bagrut breakdown", r.s === 200 && r.t.includes("בגרות חברתית") && !bad(r.t));

// register page shows grade 12
const reg = await (await fetch("http://localhost:3000/register")).text();
all &= ok("register form has grade 12 option", reg.includes("GRADE_12"));

await prisma.$disconnect();
console.log(all ? "\n🎉 RENDER OK" : "\n⚠️ FAIL");
process.exit(all ? 0 : 1);

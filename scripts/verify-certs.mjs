import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const tok = (p) => new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
const ok = (l, c) => { console.log(`${c ? "✅" : "❌"} ${l}`); return c; };
let all = true;

const u = await prisma.user.findMany({ include: { teacher: true } });
const yossi = u.find((x) => x.email === "yossi@school.il");
const noaU = u.find((x) => x.email === "noa@student.il");

// 1. footer on login + teacher
const loginHtml = await (await fetch("http://localhost:3000/login")).text();
all &= ok("footer credit on /login", loginHtml.includes("לאורי לנדסברג"));

const tCookie = await tok({ userId: yossi.id, role: "TEACHER", name: yossi.full_name });
const teacherHtml = await (await fetch("http://localhost:3000/teacher", { headers: { cookie: `session=${tCookie}` } })).text();
all &= ok("teacher: footer present", teacherHtml.includes("לאורי לנדסברג"));
all &= ok("teacher: bagrut-eligible section", teacherHtml.includes("זכאים לבגרות חברתית"));
all &= ok("teacher: eligible lists יעל", teacherHtml.includes("יעל"));
all &= ok("teacher: cert button present", teacherHtml.includes("הפק הערכה לתעודה"));

// 2. evaluations export (teacher) — parse xlsx
const res = await fetch("http://localhost:3000/api/export/evaluations", { headers: { cookie: `session=${tCookie}` } });
all &= ok("evaluations export 200 xlsx", res.status === 200 && (res.headers.get("content-type") || "").includes("spreadsheet"));
const buf = Buffer.from(await res.arrayBuffer());
const wb = XLSX.read(buf, { type: "buffer" });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
const names = rows.map((r) => r["שם התלמיד"]);
console.log("   שמות בדוח:", names.join(", "));
all &= ok("evaluations excludes grade-12 (יעל not in report)", !names.some((n) => n.includes("יעל")));
all &= ok("evaluations includes יא student (מאיה)", names.some((n) => n.includes("מאיה")));
const maya = rows.find((r) => r["שם התלמיד"].includes("מאיה"));
all &= ok(`maya text = partial (7 מתוך 30): "${(maya?.["הערכה מילולית"] || "").slice(0, 30)}..."`, /ביצעת 7 מתוך 30/.test(maya?.["הערכה מילולית"] || ""));

// 3. non-teacher blocked
const sCookie = await tok({ userId: noaU.id, role: "STUDENT", name: noaU.full_name });
const blocked = await fetch("http://localhost:3000/api/export/evaluations", { headers: { cookie: `session=${sCookie}` } });
all &= ok("student blocked from evaluations export (401)", blocked.status === 401);

await prisma.$disconnect();
console.log(all ? "\n🎉 ALL PASSED" : "\n⚠️ SOME FAILED");
process.exit(all ? 0 : 1);

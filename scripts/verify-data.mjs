import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function token(userId, role, name) {
  return new SignJWT({ userId, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function getHtml(path, cookie) {
  const res = await fetch(`http://localhost:3000${path}`, {
    headers: { cookie: `session=${cookie}` },
    redirect: "manual",
  });
  return { status: res.status, html: await res.text() };
}

function assert(label, cond) {
  console.log(`${cond ? "✅" : "❌"} ${label}`);
  return cond;
}

const users = await prisma.user.findMany({ include: { student: true } });
const admin = users.find((u) => u.role === "ADMIN");
const dana = users.find((u) => u.email === "dana@school.il");
const yossi = users.find((u) => u.email === "yossi@school.il");
const ronit = users.find((u) => u.email === "ronit@aviv.il");
const noaUser = users.find((u) => u.email === "noa@student.il");

let all = true;

console.log("--- מנהל: דשבורד מציג נתונים אמיתיים ---");
{
  const { status, html } = await getHtml("/admin", await token(admin.id, "ADMIN", admin.full_name));
  all &= assert("/admin סטטוס 200", status === 200);
  all &= assert("מציג תלמידה 'נועה לוי'", html.includes("נועה לוי"));
  all &= assert("מציג כותרת סקירה", html.includes("סקירה כללית"));
  all &= assert("מציג מקום 'בית אבות'", html.includes("בית אבות"));
}

console.log("\n--- מחנכת דנה: רואה רק את כיתתה י'3 ---");
{
  const { html } = await getHtml("/teacher", await token(dana.id, "TEACHER", dana.full_name));
  all &= assert("רואה את נועה (כיתתה)", html.includes("נועה"));
  all &= assert("לא רואה את מאיה (כיתה אחרת)", !html.includes("מאיה פרץ"));
}

console.log("\n--- מחנך יוסי: רואה את מאיה, לא את נועה ---");
{
  const { html } = await getHtml("/teacher", await token(yossi.id, "TEACHER", yossi.full_name));
  all &= assert("רואה את מאיה", html.includes("מאיה"));
  all &= assert("לא רואה את נועה לוי", !html.includes("נועה לוי"));
}

console.log("\n--- אחראי רונית: רואה תלמידי בית אבות אביב ---");
{
  const { html } = await getHtml("/supervisor", await token(ronit.id, "SUPERVISOR", ronit.full_name));
  all &= assert("רואה את נועה", html.includes("נועה"));
  all &= assert("מציג שעות במקום", html.includes("שעות במקום"));
}

console.log("\n--- תלמידה נועה: דשבורד מציג סך שעות ומקום פעיל ---");
{
  const { html } = await getHtml("/student", await token(noaUser.id, "STUDENT", noaUser.full_name));
  all &= assert("ברכה אישית", html.includes("שלום,") && html.includes("נועה"));
  all &= assert("מקום פעיל בית אבות", html.includes("בית אבות"));
  // נועה: 2.5+2+2.5+3 = 10 שעות
  all &= assert("סך שעות = 10", html.includes("10 שעות"));
}

console.log("\n--- ייצוא: מנהל מקבל CSV ---");
{
  const res = await fetch("http://localhost:3000/api/export?format=csv", {
    headers: { cookie: `session=${await token(admin.id, "ADMIN", admin.full_name)}` },
  });
  const text = await res.text();
  all &= assert("CSV סטטוס 200", res.status === 200);
  all &= assert("CSV מכיל כותרת ת\"ז (escaped)", text.includes('ת""ז'));
  all &= assert("CSV מכיל את נועה", text.includes("נועה"));
}

console.log("\n--- ייצוא: גישת תלמיד נחסמת (401) ---");
{
  const res = await fetch("http://localhost:3000/api/export?format=csv", {
    headers: { cookie: `session=${await token(noaUser.id, "STUDENT", noaUser.full_name)}` },
  });
  all &= assert("תלמיד נחסם מהייצוא", res.status === 401);
}

await prisma.$disconnect();
console.log(all ? "\n🎉 כל בדיקות הנתונים וההרשאות עברו" : "\n⚠️ חלק מהבדיקות נכשלו");
process.exit(all ? 0 : 1);

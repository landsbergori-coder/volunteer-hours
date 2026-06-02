import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function token(userId, role, name) {
  return new SignJWT({ userId, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function check(label, path, cookie, expectStatus, expectLocation) {
  const res = await fetch(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie: `session=${cookie}` } : {},
    redirect: "manual",
  });
  const loc = res.headers.get("location") ?? "";
  const okStatus = res.status === expectStatus;
  const okLoc = expectLocation === undefined || loc.includes(expectLocation);
  const pass = okStatus && okLoc;
  console.log(
    `${pass ? "✅" : "❌"} ${label}: ${res.status}${loc ? ` -> ${loc}` : ""}`
  );
  return pass;
}

// IDs from seed: need to look them up. We use role-based redirects which don't need real IDs for middleware.
const admin = await token(1, "ADMIN", "מנהל");
const student = await token(2, "STUDENT", "תלמיד");
const teacher = await token(3, "TEACHER", "מחנך");
const supervisor = await token(4, "SUPERVISOR", "אחראי");

let all = true;
console.log("--- ללא התחברות (אמור להפנות ל-login) ---");
all &= await check("אורח /admin", "/admin", null, 307, "/login");
all &= await check("אורח /student", "/student", null, 307, "/login");

console.log("\n--- בידוד הרשאות (role לא תואם -> הפניה לדשבורד שלו) ---");
all &= await check("תלמיד -> /admin", "/admin", student, 307, "/student");
all &= await check("מחנך -> /admin", "/admin", teacher, 307, "/teacher");
all &= await check("אחראי -> /student", "/student", supervisor, 307, "/supervisor");
all &= await check("מנהל -> /student", "/student", admin, 307, "/admin");

console.log("\n--- גישה מותרת לפי role (200) ---");
all &= await check("מנהל /admin", "/admin", admin, 200);

console.log("\n--- דף ציבורי כשמחובר (אמור להפנות לדשבורד) ---");
all &= await check("מנהל /login", "/login", admin, 307, "/admin");

console.log(all ? "\n🎉 כל בדיקות ההרשאות עברו" : "\n⚠️ חלק מהבדיקות נכשלו");
process.exit(all ? 0 : 1);

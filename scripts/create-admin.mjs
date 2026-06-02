/**
 * יצירת / עדכון חשבון מנהל מערכת ישירות מול בסיס הנתונים.
 *
 * שימוש:
 *   node scripts/create-admin.mjs <email> <password> ["שם מלא"]
 *
 * אם האימייל כבר קיים — הסיסמה והתפקיד יעודכנו (role=ADMIN).
 * המנהל ייווצר עם דרישה להחליף סיסמה בכניסה הראשונה (must_change_password=true).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [, , emailArg, passwordArg, ...nameParts] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error('שימוש: node scripts/create-admin.mjs <email> <password> ["שם מלא"]');
    process.exit(1);
  }
  const email = emailArg.toLowerCase().trim();
  if (passwordArg.length < 6) {
    console.error("הסיסמה חייבת להכיל לפחות 6 תווים.");
    process.exit(1);
  }
  const full_name = nameParts.join(" ").trim() || email.split("@")[0];
  const password_hash = await bcrypt.hash(passwordArg, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password_hash,
      role: "ADMIN",
      must_change_password: true,
      full_name,
    },
    create: {
      email,
      full_name,
      password_hash,
      role: "ADMIN",
      must_change_password: true,
    },
  });

  console.log(`✅ מנהל נשמר: ${user.full_name} <${user.email}>`);
  console.log("   סיסמה זמנית הוגדרה — תידרש החלפה בכניסה הראשונה.");
}

main()
  .catch((e) => {
    console.error("שגיאה:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

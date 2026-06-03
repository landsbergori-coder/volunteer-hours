"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createUserSchema, createAdminSchema, gradeLabel } from "@/lib/validation";
import { ActionState, parseForm } from "@/lib/form";
import { Role, GradeLevel } from "@prisma/client";

/** יצירת חשבון מחנך/ת או אחראי ע"י מנהל המערכת. */
export async function createUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(Role.ADMIN);
  const parsed = parseForm(createUserSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists)
    return { ok: false, errors: { email: "כתובת אימייל זו כבר רשומה" } };

  if (d.role === "TEACHER" && !d.class_name)
    return { ok: false, errors: { class_name: "יש להזין שם כיתה למחנך/ת" } };

  const password_hash = await bcrypt.hash(d.password, 10);

  await prisma.user.create({
    data: {
      full_name: d.full_name,
      email,
      password_hash,
      role: d.role as Role,
      // סיסמה זמנית — המשתמש יחליף אותה בכניסה הראשונה
      must_change_password: true,
      ...(d.role === "TEACHER"
        ? {
            teacher: {
              create: {
                full_name: d.full_name,
                email,
                class_name: d.class_name!,
              },
            },
          }
        : {}),
    },
  });

  revalidatePath("/admin/accounts");
  return {
    ok: true,
    message: `החשבון של ${d.full_name} נוצר בהצלחה. הסיסמה שהוזנה היא זמנית — המשתמש יתבקש להחליפה בכניסה הראשונה.`,
  };
}

/** יצירת חשבון מנהל מערכת נוסף (מנהל בלבד). */
export async function createAdminAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(Role.ADMIN);
  const parsed = parseForm(createAdminSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists)
    return { ok: false, errors: { email: "כתובת אימייל זו כבר רשומה" } };

  const password_hash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({
    data: {
      full_name: d.full_name,
      email,
      password_hash,
      role: Role.ADMIN,
      must_change_password: true,
    },
  });

  revalidatePath("/admin/admins");
  return {
    ok: true,
    message: `מנהל המערכת ${d.full_name} נוצר. הסיסמה זמנית — יוחלף בכניסה הראשונה.`,
  };
}

/** איפוס סיסמת מנהל לסיסמה זמנית חדשה (כפיית החלפה בכניסה הבאה). */
export async function resetAdminPasswordAction(
  formData: FormData
): Promise<void> {
  await requireRole(Role.ADMIN);
  const id = Number(formData.get("id"));
  const newPassword = String(formData.get("password") ?? "");
  if (!id || newPassword.length < 6) return;
  const password_hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.updateMany({
    where: { id, role: Role.ADMIN },
    data: { password_hash, must_change_password: true },
  });
  revalidatePath("/admin/admins");
}

/** מחיקת מנהל. אסור למחוק את עצמך או את המנהל האחרון שנותר. */
export async function deleteAdminAction(formData: FormData): Promise<void> {
  const session = await requireRole(Role.ADMIN);
  const id = Number(formData.get("id"));
  if (!id || id === session.userId) return; // לא מוחקים את עצמך
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  if (adminCount <= 1) return; // חייב להישאר לפחות מנהל אחד
  await prisma.user.deleteMany({ where: { id, role: Role.ADMIN } });
  revalidatePath("/admin/admins");
}

// ----- מחיקת נתונים -----

/**
 * מחיקת תלמיד וכל הנתונים שלו (שעות, רפלקציות, שיוכים, הערכות).
 * מחיקת ה-User מפעילה מחיקה מדורגת (cascade) של כל הקשרים.
 */
export async function deleteStudentAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const studentId = Number(formData.get("student_id"));
  if (!studentId) return;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { user_id: true },
  });
  if (!student) return;
  await prisma.user.delete({ where: { id: student.user_id } });
  revalidatePath("/admin");
  redirect("/admin");
}

/**
 * מחיקת מחנך/ת או אחראי. תלמידי המחנך נשמרים (homeroom_teacher_id -> null).
 * עבור אחראי: ההערכות שכתב נמחקות תחילה (אין למחוק את התלמידים שהעריך).
 */
export async function deleteStaffAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const userId = Number(formData.get("user_id"));
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== Role.TEACHER && user.role !== Role.SUPERVISOR))
    return;

  await prisma.$transaction(async (tx) => {
    if (user.role === Role.SUPERVISOR) {
      // ניתוק המקומות שבאחריותו ומחיקת ההערכות שכתב
      await tx.volunteerPlace.updateMany({
        where: { supervisor_user_id: userId },
        data: { supervisor_user_id: null },
      });
      await tx.supervisorEvaluation.deleteMany({
        where: { supervisor_user_id: userId },
      });
    }
    // מחיקת ה-User; מחנך -> Teacher נמחק, תלמידיו עוברים ל-null אוטומטית
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/admin/accounts");
  revalidatePath("/admin");
}

/** מחיקת כל נתוני שכבה שלמה (כל התלמידים בשכבה וכל הנתונים שלהם). */
export async function deleteGradeAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const grade = String(formData.get("grade")) as GradeLevel;
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (grade !== "GRADE_10" && grade !== "GRADE_11") return;
  // אישור כתוב חייב להתאים לשם השכבה (הגנה כפולה גם בשרת)
  if (confirm !== gradeLabel[grade]) return;

  const students = await prisma.student.findMany({
    where: { grade_level: grade },
    select: { user_id: true },
  });
  const userIds = students.map((s) => s.user_id);
  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  revalidatePath("/admin");
  redirect("/admin/data");
}

/** מחיקת כל הנתונים פרט לחשבונות המנהלים. */
export async function deleteAllDataAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "מחק הכל") return;

  await prisma.$transaction([
    prisma.supervisorEvaluation.deleteMany(),
    prisma.volunteerHours.deleteMany(),
    prisma.reflection.deleteMany(),
    prisma.studentVolunteerPlacement.deleteMany(),
    prisma.volunteerPlace.deleteMany(),
    // מחיקת כל המשתמשים שאינם מנהלים (תלמידים/מחנכים/אחראים) — מדורג למחיקת Student/Teacher
    prisma.user.deleteMany({ where: { role: { not: Role.ADMIN } } }),
  ]);

  revalidatePath("/admin");
  redirect("/admin/data");
}

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
  redirect(flash("/admin/admins", "הסיסמה אופסה — המנהל יחליף בכניסה הבאה"));
}

/** מחיקת מנהל. אסור למחוק את עצמך או את המנהל האחרון שנותר. */
export async function deleteAdminAction(formData: FormData): Promise<void> {
  const session = await requireRole(Role.ADMIN);
  const id = Number(formData.get("id"));
  if (!id || id === session.userId) return; // לא מוחקים את עצמך
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  if (adminCount <= 1) return; // חייב להישאר לפחות מנהל אחד
  await prisma.user.deleteMany({ where: { id, role: Role.ADMIN } });
  redirect(flash("/admin/admins", "המנהל נמחק"));
}

// ----- מחיקה / ארכיון של נתונים -----

/** בונה נתיב עם פרמטר flash להצגת Toast לאחר redirect. */
function flash(path: string, msg: string): string {
  return `${path}?flash=${encodeURIComponent(msg)}`;
}

/**
 * מחיקה לצמיתות של משתמש (לפי תפקיד). מחיקת ה-User מפעילה מחיקה מדורגת.
 * עבור אחראי: מנתקים אותו ממקומות ומוחקים את ההערכות שכתב תחילה.
 * מנהלים אינם נמחקים דרך מסלול זה.
 */
async function purgeUserById(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === Role.ADMIN) return;
  await prisma.$transaction(async (tx) => {
    if (user.role === Role.SUPERVISOR) {
      await tx.volunteerPlace.updateMany({
        where: { supervisor_user_id: userId },
        data: { supervisor_user_id: null },
      });
      await tx.supervisorEvaluation.deleteMany({
        where: { supervisor_user_id: userId },
      });
    }
    await tx.user.delete({ where: { id: userId } });
  });
}

async function userIdForStudent(studentId: number): Promise<number | null> {
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    select: { user_id: true },
  });
  return s?.user_id ?? null;
}

/** מחיקת תלמיד לצמיתות (כולל כל נתוניו, מדורג). */
export async function deleteStudentAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const uid = await userIdForStudent(Number(formData.get("student_id")));
  if (!uid) return;
  await purgeUserById(uid);
  revalidatePath("/admin");
  redirect(flash("/admin", "התלמיד/ה נמחק/ה לצמיתות"));
}

/** העברת תלמיד לארכיון (הפיך — הנתונים נשמרים). */
export async function archiveStudentAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const uid = await userIdForStudent(Number(formData.get("student_id")));
  if (!uid) return;
  await prisma.user.update({
    where: { id: uid },
    data: { archived_at: new Date() },
  });
  revalidatePath("/admin");
  redirect(flash("/admin", "התלמיד/ה הועבר/ה לארכיון"));
}

/** מחיקת מחנך/אחראי לצמיתות. תלמידי המחנך נשמרים (homeroom_teacher_id -> null). */
export async function deleteStaffAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const userId = Number(formData.get("user_id"));
  if (!userId) return;
  await purgeUserById(userId);
  revalidatePath("/admin");
  redirect(flash("/admin/accounts", "החשבון נמחק לצמיתות"));
}

/** העברת מחנך/אחראי לארכיון (הפיך). */
export async function archiveStaffAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const userId = Number(formData.get("user_id"));
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== Role.TEACHER && user.role !== Role.SUPERVISOR))
    return;
  await prisma.user.update({
    where: { id: userId },
    data: { archived_at: new Date() },
  });
  revalidatePath("/admin");
  redirect(flash("/admin/accounts", "החשבון הועבר לארכיון"));
}

/** מחיקת שכבה שלמה לצמיתות (אישור כתוב נדרש). */
export async function deleteGradeAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const grade = String(formData.get("grade")) as GradeLevel;
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (grade !== "GRADE_10" && grade !== "GRADE_11") return;
  if (confirm !== gradeLabel[grade]) return;

  const students = await prisma.student.findMany({
    where: { grade_level: grade },
    select: { user_id: true },
  });
  const userIds = students.map((s) => s.user_id);
  if (userIds.length > 0)
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  revalidatePath("/admin");
  redirect(flash("/admin/data", `שכבה ${gradeLabel[grade]} נמחקה לצמיתות`));
}

/** העברת שכבה שלמה לארכיון (הפיך). */
export async function archiveGradeAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const grade = String(formData.get("grade")) as GradeLevel;
  if (grade !== "GRADE_10" && grade !== "GRADE_11") return;
  await prisma.user.updateMany({
    where: { student: { grade_level: grade }, archived_at: null },
    data: { archived_at: new Date() },
  });
  revalidatePath("/admin");
  redirect(flash("/admin/data", `שכבה ${gradeLabel[grade]} הועברה לארכיון`));
}

/** מחיקת כל הנתונים פרט לחשבונות המנהלים (אישור כתוב נדרש). */
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
    prisma.user.deleteMany({ where: { role: { not: Role.ADMIN } } }),
  ]);
  revalidatePath("/admin");
  redirect(flash("/admin/data", "כל הנתונים נמחקו לצמיתות"));
}

/** העברת כל הנתונים לארכיון (הפיך) — כל המשתמשים שאינם מנהלים. */
export async function archiveAllDataAction(): Promise<void> {
  await requireRole(Role.ADMIN);
  await prisma.user.updateMany({
    where: { role: { not: Role.ADMIN }, archived_at: null },
    data: { archived_at: new Date() },
  });
  revalidatePath("/admin");
  redirect(flash("/admin/data", "כל הנתונים הועברו לארכיון"));
}

/**
 * העברת שנה: י' → י"א, י"א → י"ב, י"ב → ארכיון. השעות נשמרות.
 * המקודמים מסומנים לעדכון מקום התנדבות בכניסה הבאה.
 */
export async function advanceYearAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "העבר שנה") return;

  await prisma.$transaction([
    // 1. ארכוב תלמידי י"ב הנוכחיים
    prisma.user.updateMany({
      where: { archived_at: null, student: { grade_level: "GRADE_12" } },
      data: { archived_at: new Date() },
    }),
    // 2. י"א → י"ב
    prisma.student.updateMany({
      where: { grade_level: "GRADE_11" },
      data: { grade_level: "GRADE_12", needs_placement_review: true },
    }),
    // 3. י' → י"א
    prisma.student.updateMany({
      where: { grade_level: "GRADE_10" },
      data: { grade_level: "GRADE_11", needs_placement_review: true },
    }),
  ]);

  revalidatePath("/admin");
  redirect(flash("/admin/data", "העברת השנה בוצעה בהצלחה"));
}

// ----- שחזור / מחיקה מהארכיון -----

/** שחזור פריט מהארכיון. */
export async function restoreUserAction(formData: FormData): Promise<void> {
  await requireRole(Role.ADMIN);
  const userId = Number(formData.get("user_id"));
  if (!userId) return;
  await prisma.user.update({
    where: { id: userId },
    data: { archived_at: null },
  });
  redirect(flash("/admin/archive", "הפריט שוחזר בהצלחה"));
}

/** מחיקה לצמיתות של פריט מהארכיון. */
export async function purgeArchivedUserAction(
  formData: FormData
): Promise<void> {
  await requireRole(Role.ADMIN);
  const userId = Number(formData.get("user_id"));
  if (!userId) return;
  await purgeUserById(userId);
  redirect(flash("/admin/archive", "הפריט נמחק לצמיתות"));
}

/** שחזור כל הפריטים מהארכיון. */
export async function restoreAllArchivedAction(): Promise<void> {
  await requireRole(Role.ADMIN);
  await prisma.user.updateMany({
    where: { archived_at: { not: null } },
    data: { archived_at: null },
  });
  redirect(flash("/admin/archive", "כל הפריטים שוחזרו"));
}

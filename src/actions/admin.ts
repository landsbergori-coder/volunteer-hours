"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createUserSchema, createAdminSchema } from "@/lib/validation";
import { ActionState, parseForm } from "@/lib/form";
import { Role } from "@prisma/client";

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

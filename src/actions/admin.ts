"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createUserSchema } from "@/lib/validation";
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
    message: `החשבון של ${d.full_name} נוצר בהצלחה`,
  };
}

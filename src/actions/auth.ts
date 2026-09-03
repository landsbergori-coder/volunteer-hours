"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  dashboardPath,
  getSession,
} from "@/lib/auth";
import {
  loginSchema,
  registerStudentSchema,
  changePasswordSchema,
} from "@/lib/validation";
import { ActionState, parseForm } from "@/lib/form";
import { Role } from "@prisma/client";

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { ok: false, message: "אימייל או סיסמה שגויים" };
  }
  if (user.archived_at) {
    return { ok: false, message: "החשבון אינו פעיל (הועבר לארכיון)" };
  }

  const token = await createSession({
    userId: user.id,
    role: user.role,
    name: user.full_name,
    mustChangePassword: user.must_change_password,
  });
  await setSessionCookie(token);
  if (user.must_change_password) redirect("/change-password");
  redirect(dashboardPath(user.role));
}

export async function registerStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseForm(registerStudentSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };

  const d = parsed.data;
  const email = d.email.toLowerCase();

  // בדיקות ייחודיות
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail)
    return { ok: false, errors: { email: "כתובת אימייל זו כבר רשומה במערכת" } };

  const existingId = await prisma.student.findUnique({
    where: { national_id: d.national_id },
  });
  if (existingId)
    return {
      ok: false,
      errors: { national_id: "תעודת זהות זו כבר רשומה במערכת" },
    };

  // הכיתה שנבחרה היא מקור האמת: ממנה נגזרים שם הכיתה, השכבה והמחנך/ת
  const teacher = await prisma.teacher.findUnique({
    where: { id: d.homeroom_teacher_id },
  });
  if (!teacher)
    return { ok: false, errors: { homeroom_teacher_id: "הכיתה שנבחרה לא נמצאה" } };

  const password_hash = await bcrypt.hash(d.password, 10);

  const user = await prisma.user.create({
    data: {
      full_name: `${d.first_name} ${d.last_name}`,
      email,
      password_hash,
      role: Role.STUDENT,
      student: {
        create: {
          first_name: d.first_name,
          last_name: d.last_name,
          national_id: d.national_id,
          grade_level: teacher.grade_level,
          class_name: teacher.class_name,
          homeroom_teacher_id: teacher.id,
        },
      },
    },
  });

  const token = await createSession({
    userId: user.id,
    role: Role.STUDENT,
    name: user.full_name,
  });
  await setSessionCookie(token);
  redirect("/student");
}

/** החלפת סיסמה — לכניסה ראשונה כפויה או החלפה יזומה ע"י כל משתמש מחובר. */
export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = parseForm(changePasswordSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  if (!(await bcrypt.compare(d.current_password, user.password_hash)))
    return { ok: false, errors: { current_password: "הסיסמה הנוכחית שגויה" } };

  const password_hash = await bcrypt.hash(d.new_password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash, must_change_password: false },
  });

  // הנפקת cookie מחודש ללא דגל החלפת הסיסמה
  const token = await createSession({
    userId: user.id,
    role: user.role,
    name: user.full_name,
    mustChangePassword: false,
  });
  await setSessionCookie(token);
  redirect(dashboardPath(user.role));
}

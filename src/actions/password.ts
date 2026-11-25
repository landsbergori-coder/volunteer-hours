"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * איפוס סיסמת תלמיד/ה לסיסמה זמנית חדשה (כפיית החלפה בכניסה הבאה).
 * מנהל — לכל תלמיד/ה; מחנך/ת — לתלמידי הכיתה שלו/ה בלבד.
 */
export async function resetStudentPasswordAction(
  formData: FormData
): Promise<void> {
  const session = await requireRole(Role.ADMIN, Role.TEACHER);
  const studentId = Number(formData.get("id"));
  const newPassword = String(formData.get("password") ?? "");
  if (!studentId || newPassword.length < 6) return;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { user_id: true, homeroom_teacher_id: true },
  });
  if (!student) return;

  if (session.role === Role.TEACHER) {
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: session.userId },
      select: { id: true },
    });
    // הרשאה: המחנך/ת מאפס/ת רק לתלמידי הכיתה שלו/ה
    if (!teacher || student.homeroom_teacher_id !== teacher.id) return;
  }

  const password_hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: student.user_id },
    data: { password_hash, must_change_password: true },
  });

  const base = session.role === Role.ADMIN ? "/admin" : "/teacher";
  const msg = "הסיסמה אופסה — התלמיד/ה יתבקש/תתבקש להחליף אותה בכניסה הבאה";
  redirect(`${base}/student/${studentId}?flash=${encodeURIComponent(msg)}`);
}

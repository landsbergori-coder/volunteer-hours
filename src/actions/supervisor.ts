"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { evaluationSchema } from "@/lib/validation";
import { ActionState, parseForm } from "@/lib/form";
import { Role } from "@prisma/client";

/**
 * הזנת הערכה מילולית ע"י אחראי מקום התנדבות.
 * האחראי יכול להעריך רק תלמידים עם placement פעיל במקום שבאחריותו.
 */
export async function createEvaluationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole(Role.SUPERVISOR);
  const parsed = parseForm(evaluationSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;

  // אימות שהתלמיד אכן משויך פעיל למקום שבאחריות המשתמש
  const placement = await prisma.studentVolunteerPlacement.findFirst({
    where: {
      student_id: d.student_id,
      is_active: true,
      volunteer_place: { supervisor_user_id: session.userId },
    },
    include: { volunteer_place: true },
  });
  if (!placement)
    return { ok: false, message: "אין הרשאה להעריך תלמיד/ה זה/זו" };

  await prisma.supervisorEvaluation.create({
    data: {
      student_id: d.student_id,
      volunteer_place_id: placement.volunteer_place_id,
      supervisor_user_id: session.userId,
      evaluation_text: d.evaluation_text,
    },
  });

  revalidatePath("/supervisor");
  return { ok: true, message: "ההערכה נשמרה בהצלחה" };
}

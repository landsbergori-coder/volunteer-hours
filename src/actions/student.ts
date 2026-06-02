"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { calculateHours, isValidVolunteerDate } from "@/lib/hours";
import {
  hoursSchema,
  placeSchema,
  reflectionSchema,
} from "@/lib/validation";
import { ActionState, parseForm } from "@/lib/form";
import { Role } from "@prisma/client";

/** מאתר את רשומת התלמיד של המשתמש המחובר. */
async function getCurrentStudent() {
  const session = await requireRole(Role.STUDENT);
  const student = await prisma.student.findUnique({
    where: { user_id: session.userId },
  });
  if (!student) throw new Error("רשומת תלמיד לא נמצאה");
  return student;
}

/** דיווח שעות התנדבות חדש. */
export async function addHoursAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const student = await getCurrentStudent();
  const parsed = parseForm(hoursSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;

  if (!isValidVolunteerDate(d.volunteer_date))
    return { ok: false, errors: { volunteer_date: "תאריך אינו תקין" } };

  // חייב מקום התנדבות פעיל
  const placement = await prisma.studentVolunteerPlacement.findFirst({
    where: { student_id: student.id, is_active: true },
  });
  if (!placement)
    return {
      ok: false,
      message: "לא ניתן לדווח שעות ללא מקום התנדבות פעיל. הגדר/י מקום התנדבות תחילה.",
    };

  const calc = calculateHours(d.start_time, d.end_time);
  if (!calc.ok) return { ok: false, message: calc.error };

  await prisma.volunteerHours.create({
    data: {
      student_id: student.id,
      volunteer_place_id: placement.volunteer_place_id,
      placement_id: placement.id,
      volunteer_date: new Date(d.volunteer_date),
      start_time: d.start_time,
      end_time: d.end_time,
      calculated_hours: calc.hours,
      description: d.description || null,
    },
  });

  revalidatePath("/student");
  revalidatePath("/student/hours");
  return { ok: true, message: `נרשמו ${calc.hours} שעות בהצלחה` };
}

/** מחיקת דיווח שעות (רק של התלמיד עצמו). */
export async function deleteHoursAction(formData: FormData): Promise<void> {
  const student = await getCurrentStudent();
  const id = Number(formData.get("id"));
  await prisma.volunteerHours.deleteMany({
    where: { id, student_id: student.id },
  });
  revalidatePath("/student");
  revalidatePath("/student/hours");
}

/**
 * הגדרת / שינוי מקום התנדבות.
 * סוגר את המקום הפעיל הקודם (היסטוריה) ופותח מקום חדש פעיל.
 * שעות קודמות נשמרות ומשויכות ל-placement הישן.
 */
export async function setPlaceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const student = await getCurrentStudent();
  const parsed = parseForm(placeSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;
  const supEmail = d.supervisor_email.toLowerCase();

  await prisma.$transaction(async (tx) => {
    // סגירת המקום הפעיל הקודם
    await tx.studentVolunteerPlacement.updateMany({
      where: { student_id: student.id, is_active: true },
      data: { is_active: false, end_date: new Date() },
    });

    // קישור לאחראי קיים אם יש חשבון תואם לפי אימייל
    const supervisorUser = await tx.user.findUnique({
      where: { email: supEmail },
    });

    // מציאת מקום קיים תואם, אחרת יצירה
    let place = await tx.volunteerPlace.findFirst({
      where: { place_name: d.place_name, supervisor_email: supEmail },
    });
    if (!place) {
      place = await tx.volunteerPlace.create({
        data: {
          place_name: d.place_name,
          supervisor_name: d.supervisor_name,
          supervisor_phone: d.supervisor_phone,
          supervisor_email: supEmail,
          supervisor_user_id:
            supervisorUser?.role === Role.SUPERVISOR
              ? supervisorUser.id
              : null,
        },
      });
    }

    await tx.studentVolunteerPlacement.create({
      data: {
        student_id: student.id,
        volunteer_place_id: place.id,
        is_active: true,
      },
    });
  });

  revalidatePath("/student");
  revalidatePath("/student/place");
  return { ok: true, message: "מקום ההתנדבות נשמר בהצלחה" };
}

/** שמירת רפלקציה למחצית (אחת לכל מחצית). */
export async function saveReflectionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const student = await getCurrentStudent();
  const parsed = parseForm(reflectionSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;

  await prisma.reflection.upsert({
    where: {
      student_id_semester: { student_id: student.id, semester: d.semester },
    },
    update: { content: d.content, submitted_at: new Date() },
    create: {
      student_id: student.id,
      semester: d.semester,
      content: d.content,
    },
  });

  revalidatePath("/student");
  revalidatePath("/student/reflection");
  return { ok: true, message: "הרפלקציה נשמרה בהצלחה" };
}

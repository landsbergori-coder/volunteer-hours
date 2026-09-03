"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { calculateHours, isValidVolunteerDate } from "@/lib/hours";
import {
  endPlacementSchema,
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

  // השעות נרשמות למקום ההתנדבות שנבחר — חייב להיות פעיל ושייך לתלמיד/ה
  const placement = await prisma.studentVolunteerPlacement.findFirst({
    where: { id: d.placement_id, student_id: student.id, is_active: true },
  });
  if (!placement)
    return {
      ok: false,
      message:
        "לא ניתן לדווח שעות ללא מקום התנדבות פעיל. יש לבחור מקום התנדבות פעיל.",
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
      grade_level: student.grade_level, // תיוג השעה לשכבה הנוכחית
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
 * הוספת מקום התנדבות פעיל.
 * תלמיד/ה יכול/ה להתנדב בכמה מקומות במקביל — המקומות הפעילים הקיימים
 * נשארים פעילים, וכל דיווח שעות משויך למקום שנבחר.
 */
export async function addPlaceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const student = await getCurrentStudent();
  const parsed = parseForm(placeSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;
  const supEmail = d.supervisor_email.toLowerCase();

  const result = await prisma.$transaction(async (tx) => {
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

    // מניעת כפילות — אותו מקום כבר פעיל אצל התלמיד/ה
    const existing = await tx.studentVolunteerPlacement.findFirst({
      where: {
        student_id: student.id,
        volunteer_place_id: place.id,
        is_active: true,
      },
    });
    if (existing) return { duplicate: true as const, name: place.place_name };

    await tx.studentVolunteerPlacement.create({
      data: {
        student_id: student.id,
        volunteer_place_id: place.id,
        is_active: true,
      },
    });
    return { duplicate: false as const, name: place.place_name };
  });

  if (result.duplicate)
    return {
      ok: false,
      message: `"${result.name}" כבר מופיע ברשימת מקומות ההתנדבות הפעילים שלך.`,
    };

  revalidatePath("/student");
  revalidatePath("/student/place");
  revalidatePath("/student/hours");
  return { ok: true, message: `מקום ההתנדבות "${result.name}" נוסף בהצלחה` };
}

/**
 * סיום התנדבות במקום מסוים — המקום עובר להיסטוריה.
 * שאר המקומות הפעילים ממשיכים, והשעות שדווחו נשמרות.
 */
export async function endPlacementAction(
  formData: FormData
): Promise<void> {
  const student = await getCurrentStudent();
  const parsed = parseForm(endPlacementSchema, formData);
  if (!parsed.success) return;

  await prisma.studentVolunteerPlacement.updateMany({
    where: {
      id: parsed.data.placement_id,
      student_id: student.id,
      is_active: true,
    },
    data: { is_active: false, end_date: new Date() },
  });

  revalidatePath("/student");
  revalidatePath("/student/place");
  revalidatePath("/student/hours");
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

/** הרשמה למסלול בגרות חברתית (לתלמידי י"ב בלבד). */
export async function registerBagrutAction(): Promise<void> {
  const student = await getCurrentStudent();
  if (student.grade_level !== "GRADE_12") return;
  await prisma.student.update({
    where: { id: student.id },
    data: { bagrut_track: true },
  });
  revalidatePath("/student");
}

/**
 * תשובת התלמיד/ה לאחר העברת שנה: בחירה באילו ממקומות ההתנדבות הפעילים להמשיך.
 * מקומות שלא סומנו עוברים להיסטוריה (השעות שדווחו בהם נשמרות),
 * והמקומות שסומנו נשארים פעילים. בכל מקרה דגל הבקשה מתנקה.
 */
export async function resolvePlacementReviewAction(
  formData: FormData
): Promise<void> {
  const student = await getCurrentStudent();

  // המקומות שסומנו להמשך. רשימה ריקה = סיום כל המקומות הפעילים.
  const keepIds = formData
    .getAll("keep_placement_id")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  await prisma.$transaction([
    // הסינון לפי student_id מבטיח שאפשר לסיים רק מקומות של התלמיד/ה עצמו/ה.
    // כשאין סימון כלל — כל המקומות הפעילים מסתיימים (ללא תנאי id).
    prisma.studentVolunteerPlacement.updateMany({
      where: {
        student_id: student.id,
        is_active: true,
        ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
      },
      data: { is_active: false, end_date: new Date() },
    }),
    prisma.student.update({
      where: { id: student.id },
      data: { needs_placement_review: false },
    }),
  ]);

  revalidatePath("/student");
  revalidatePath("/student/place");
  revalidatePath("/student/hours");
  if (formData.get("intent") === "edit") redirect("/student/place");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { calculateHours, isValidVolunteerDate } from "@/lib/hours";
import {
  editSupervisorSchema,
  endPlacementSchema,
  hoursSchema,
  placeSchema,
  reflectionSchema,
} from "@/lib/validation";
import { ActionState, parseForm } from "@/lib/form";
import { Prisma, Role } from "@prisma/client";

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

/** קישור לחשבון "אחראי מקום התנדבות" קיים לפי אימייל (אם יש כזה). */
async function supervisorUserIdFor(
  tx: Prisma.TransactionClient,
  email: string
): Promise<number | null> {
  if (!email) return null;
  const user = await tx.user.findUnique({ where: { email } });
  return user?.role === Role.SUPERVISOR ? user.id : null;
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
  // האימייל אינו חובה. כשהוא ריק פשוט לא נוצר קישור לחשבון אחראי.
  const supEmail = (d.supervisor_email ?? "").toLowerCase();

  const result = await prisma.$transaction(async (tx) => {
    // מציאת מקום קיים תואם, אחרת יצירה.
    // בלי אימייל אין מזהה ייחודי למקום, ולכן ההתאמה היא לפי שם המקום
    // יחד עם פרטי האחראי — אחרת שני מקומות שונים בעלי אותו שם היו מתמזגים.
    let place = await tx.volunteerPlace.findFirst({
      where: supEmail
        ? { place_name: d.place_name, supervisor_email: supEmail }
        : {
            place_name: d.place_name,
            supervisor_email: "",
            supervisor_name: d.supervisor_name,
            supervisor_phone: d.supervisor_phone,
          },
    });
    if (!place) {
      place = await tx.volunteerPlace.create({
        data: {
          place_name: d.place_name,
          supervisor_name: d.supervisor_name,
          supervisor_phone: d.supervisor_phone,
          supervisor_email: supEmail,
          supervisor_user_id: await supervisorUserIdFor(tx, supEmail),
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
 * עדכון פרטי האחראי (שם, טלפון, אימייל) במקום התנדבות פעיל של התלמיד/ה.
 * השינוי חל על התלמיד/ה בלבד: אם תלמידים אחרים משויכים לאותו מקום,
 * ההתנדבות של התלמיד/ה (כולל השעות שדווחו בה) עוברת לרשומת מקום נפרדת
 * עם הפרטים החדשים, ושאר התלמידים נשארים עם הפרטים הקודמים.
 */
export async function updatePlaceSupervisorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const student = await getCurrentStudent();
  const parsed = parseForm(editSupervisorSchema, formData);
  if (!parsed.success) return { ok: false, errors: parsed.errors };
  const d = parsed.data;

  const placement = await prisma.studentVolunteerPlacement.findFirst({
    where: { id: d.placement_id, student_id: student.id, is_active: true },
    include: { volunteer_place: true },
  });
  if (!placement)
    return { ok: false, message: "מקום ההתנדבות לא נמצא או שאינו פעיל" };

  const old = placement.volunteer_place;
  const details = {
    supervisor_name: d.supervisor_name,
    supervisor_phone: d.supervisor_phone,
    supervisor_email: (d.supervisor_email ?? "").toLowerCase(),
  };
  if (
    old.supervisor_name === details.supervisor_name &&
    old.supervisor_phone === details.supervisor_phone &&
    old.supervisor_email === details.supervisor_email
  )
    return { ok: true, message: "לא בוצע שינוי" };

  const error = await prisma.$transaction(async (tx) => {
    const supervisor_user_id = await supervisorUserIdFor(
      tx,
      details.supervisor_email
    );
    const sharedWithOthers =
      (await tx.studentVolunteerPlacement.count({
        where: { volunteer_place_id: old.id, student_id: { not: student.id } },
      })) > 0;

    // המקום של התלמיד/ה בלבד — מעדכנים אותו ישירות
    if (!sharedWithOthers) {
      await tx.volunteerPlace.update({
        where: { id: old.id },
        data: { ...details, supervisor_user_id },
      });
      return null;
    }

    // מקום משותף — מעבירים רק את ההתנדבות הזו למקום עם הפרטים החדשים
    let target = await tx.volunteerPlace.findFirst({
      where: { place_name: old.place_name, ...details, id: { not: old.id } },
    });
    if (target) {
      const duplicate = await tx.studentVolunteerPlacement.findFirst({
        where: {
          student_id: student.id,
          volunteer_place_id: target.id,
          is_active: true,
        },
      });
      if (duplicate)
        return "כבר יש לך מקום התנדבות פעיל עם אותו שם ואותם פרטי אחראי.";
    } else {
      target = await tx.volunteerPlace.create({
        data: { place_name: old.place_name, ...details, supervisor_user_id },
      });
    }
    await tx.studentVolunteerPlacement.update({
      where: { id: placement.id },
      data: { volunteer_place_id: target.id },
    });
    await tx.volunteerHours.updateMany({
      where: { placement_id: placement.id },
      data: { volunteer_place_id: target.id },
    });
    return null;
  });

  if (error) return { ok: false, message: error };

  revalidatePath("/student");
  revalidatePath("/student/place");
  revalidatePath("/student/hours");
  revalidatePath("/teacher");
  revalidatePath("/admin");
  revalidatePath("/admin/places");
  return { ok: true, message: "פרטי האחראי עודכנו" };
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

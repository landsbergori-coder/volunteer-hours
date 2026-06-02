import { PrismaClient, Role, GradeLevel, Semester } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "123456";

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.round(((eh * 60 + em - (sh * 60 + sm)) / 60) * 100) / 100;
}

async function main() {
  console.log("🌱 מאתחל נתוני דוגמה...");

  // ניקוי (סדר חשוב בגלל קשרי מפתח זר)
  await prisma.supervisorEvaluation.deleteMany();
  await prisma.volunteerHours.deleteMany();
  await prisma.reflection.deleteMany();
  await prisma.studentVolunteerPlacement.deleteMany();
  await prisma.volunteerPlace.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ---- מנהל ----
  await prisma.user.create({
    data: {
      full_name: "מנהל המערכת",
      email: "admin@school.il",
      password_hash: hash,
      role: Role.ADMIN,
    },
  });

  // ---- מחנכים ----
  const teacher1User = await prisma.user.create({
    data: {
      full_name: "דנה כהן",
      email: "dana@school.il",
      password_hash: hash,
      role: Role.TEACHER,
      teacher: { create: { full_name: "דנה כהן", email: "dana@school.il", class_name: "י'3" } },
    },
    include: { teacher: true },
  });
  const teacher2User = await prisma.user.create({
    data: {
      full_name: "יוסי לוי",
      email: "yossi@school.il",
      password_hash: hash,
      role: Role.TEACHER,
      teacher: { create: { full_name: "יוסי לוי", email: "yossi@school.il", class_name: 'י"א2' } },
    },
    include: { teacher: true },
  });
  const teacher1 = teacher1User.teacher!;
  const teacher2 = teacher2User.teacher!;

  // ---- אחראי מקומות התנדבות ----
  const sup1 = await prisma.user.create({
    data: {
      full_name: "רונית מזרחי",
      email: "ronit@aviv.il",
      password_hash: hash,
      role: Role.SUPERVISOR,
    },
  });
  const sup2 = await prisma.user.create({
    data: {
      full_name: "אבי שלום",
      email: "avi@magen.il",
      password_hash: hash,
      role: Role.SUPERVISOR,
    },
  });

  // ---- מקומות התנדבות ----
  const placeAviv = await prisma.volunteerPlace.create({
    data: {
      place_name: 'בית אבות "אביב"',
      supervisor_name: "רונית מזרחי",
      supervisor_phone: "050-1112233",
      supervisor_email: "ronit@aviv.il",
      supervisor_user_id: sup1.id,
    },
  });
  const placeMagen = await prisma.volunteerPlace.create({
    data: {
      place_name: 'עמותת "מגן"',
      supervisor_name: "אבי שלום",
      supervisor_phone: "052-4445566",
      supervisor_email: "avi@magen.il",
      supervisor_user_id: sup2.id,
    },
  });
  const placeLibrary = await prisma.volunteerPlace.create({
    data: {
      place_name: "ספרייה עירונית",
      supervisor_name: "מירי דהן",
      supervisor_phone: "054-7778899",
      supervisor_email: "miri@library.il",
    },
  });

  // ---- תלמידים ----
  async function createStudent(opts: {
    first: string;
    last: string;
    id: string;
    grade: GradeLevel;
    cls: string;
    teacherId: number;
    email: string;
  }) {
    const u = await prisma.user.create({
      data: {
        full_name: `${opts.first} ${opts.last}`,
        email: opts.email,
        password_hash: hash,
        role: Role.STUDENT,
        student: {
          create: {
            first_name: opts.first,
            last_name: opts.last,
            national_id: opts.id,
            grade_level: opts.grade,
            class_name: opts.cls,
            homeroom_teacher_id: opts.teacherId,
          },
        },
      },
      include: { student: true },
    });
    return u.student!;
  }

  const noa = await createStudent({
    first: "נועה",
    last: "לוי",
    id: "311111111",
    grade: GradeLevel.GRADE_10,
    cls: "י'3",
    teacherId: teacher1.id,
    email: "noa@student.il",
  });
  const itai = await createStudent({
    first: "איתי",
    last: "ברק",
    id: "322222222",
    grade: GradeLevel.GRADE_10,
    cls: "י'3",
    teacherId: teacher1.id,
    email: "itai@student.il",
  });
  const maya = await createStudent({
    first: "מאיה",
    last: "פרץ",
    id: "333333333",
    grade: GradeLevel.GRADE_11,
    cls: 'י"א2',
    teacherId: teacher2.id,
    email: "maya@student.il",
  });
  const omer = await createStudent({
    first: "עומר",
    last: "דגן",
    id: "344444444",
    grade: GradeLevel.GRADE_11,
    cls: 'י"א2',
    teacherId: teacher2.id,
    email: "omer@student.il",
  });
  const tamar = await createStudent({
    first: "תמר",
    last: "שני",
    id: "355555555",
    grade: GradeLevel.GRADE_10,
    cls: "י'3",
    teacherId: teacher1.id,
    email: "tamar@student.il",
  });

  // ---- placements ----
  // נועה: התחילה בספרייה (נסגר), עברה לבית אבות (פעיל) — להדגמת שינוי מקום
  const noaOld = await prisma.studentVolunteerPlacement.create({
    data: {
      student_id: noa.id,
      volunteer_place_id: placeLibrary.id,
      start_date: new Date("2025-09-01"),
      end_date: new Date("2025-11-15"),
      is_active: false,
    },
  });
  const noaActive = await prisma.studentVolunteerPlacement.create({
    data: {
      student_id: noa.id,
      volunteer_place_id: placeAviv.id,
      start_date: new Date("2025-11-16"),
      is_active: true,
    },
  });

  const itaiActive = await prisma.studentVolunteerPlacement.create({
    data: { student_id: itai.id, volunteer_place_id: placeMagen.id, is_active: true },
  });
  const mayaActive = await prisma.studentVolunteerPlacement.create({
    data: { student_id: maya.id, volunteer_place_id: placeAviv.id, is_active: true },
  });
  const tamarActive = await prisma.studentVolunteerPlacement.create({
    data: { student_id: tamar.id, volunteer_place_id: placeLibrary.id, is_active: true },
  });
  // עומר — ללא מקום וללא שעות (להדגמת רשימות חוסר)

  // ---- דיווחי שעות ----
  async function addHours(
    studentId: number,
    placeId: number,
    placementId: number,
    date: string,
    start: string,
    end: string,
    desc: string
  ) {
    await prisma.volunteerHours.create({
      data: {
        student_id: studentId,
        volunteer_place_id: placeId,
        placement_id: placementId,
        volunteer_date: new Date(date),
        start_time: start,
        end_time: end,
        calculated_hours: hoursBetween(start, end),
        description: desc,
      },
    });
  }

  // נועה — שעות במקום הישן ובמקום החדש (שתיהן נשמרות בסך הכולל)
  await addHours(noa.id, placeLibrary.id, noaOld.id, "2025-09-10", "16:00", "18:30", "סידור ספרים");
  await addHours(noa.id, placeLibrary.id, noaOld.id, "2025-10-08", "16:00", "18:00", "עזרה בדלפק");
  await addHours(noa.id, placeAviv.id, noaActive.id, "2025-11-20", "17:00", "19:30", "פעילות עם הדיירים");
  await addHours(noa.id, placeAviv.id, noaActive.id, "2025-12-04", "17:00", "20:00", "ערב שירה");

  // איתי
  await addHours(itai.id, placeMagen.id, itaiActive.id, "2025-11-02", "09:00", "12:00", "מיון תרומות");
  await addHours(itai.id, placeMagen.id, itaiActive.id, "2025-11-23", "09:00", "11:30", "חלוקת מזון");

  // מאיה
  await addHours(maya.id, placeAviv.id, mayaActive.id, "2025-10-15", "16:30", "19:00", "ליווי דיירים");
  await addHours(maya.id, placeAviv.id, mayaActive.id, "2025-11-12", "16:30", "19:30", "הפעלת חוג");
  await addHours(maya.id, placeAviv.id, mayaActive.id, "2025-12-10", "16:30", "18:00", "סיוע בארוחה");

  // תמר
  await addHours(tamar.id, placeLibrary.id, tamarActive.id, "2025-11-05", "15:00", "17:00", "שעת סיפור לילדים");

  // ---- רפלקציות (שתי דוגמאות) ----
  await prisma.reflection.create({
    data: {
      student_id: noa.id,
      semester: Semester.A,
      content:
        "ההתנדבות בבית האבות לימדה אותי כמה חשוב להקשיב לאנשים מבוגרים ולתת מזמני עבורם. הרגשתי שעשיתי שינוי קטן אך משמעותי.",
    },
  });
  await prisma.reflection.create({
    data: {
      student_id: maya.id,
      semester: Semester.A,
      content:
        "למדתי לתכנן פעילויות ולהתמודד עם אתגרים. ההתנדבות חיזקה בי תחושת אחריות ושייכות לקהילה.",
    },
  });

  // ---- הערכת אחראי (דוגמה אחת) ----
  await prisma.supervisorEvaluation.create({
    data: {
      student_id: noa.id,
      volunteer_place_id: placeAviv.id,
      supervisor_user_id: sup1.id,
      evaluation_text:
        "נועה מתנדבת מסורה, אחראית ובעלת יחס חם לדיירים. מגיעה בזמן ותורמת רבות לאווירה במקום.",
    },
  });

  console.log("✅ נתוני הדוגמה נוצרו בהצלחה!");
  console.log("\nפרטי התחברות (סיסמה לכולם: 123456):");
  console.log("  מנהל:    admin@school.il");
  console.log("  מחנכת:   dana@school.il (כיתה י'3)");
  console.log("  מחנך:    yossi@school.il (כיתה י\"א2)");
  console.log("  אחראי 1: ronit@aviv.il (בית אבות אביב)");
  console.log("  אחראי 2: avi@magen.il (עמותת מגן)");
  console.log("  תלמידה:  noa@student.il");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

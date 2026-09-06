import { z } from "zod";

/** שם המוסד החינוכי — מוצג במסך ההתחברות ובכל המסכים. */
export const SCHOOL_NAME = "מוסד חינוכי עמקים-תבור";

export const gradeLevels = ["GRADE_10", "GRADE_11", "GRADE_12"] as const;

export const gradeLabel: Record<string, string> = {
  GRADE_10: "י'",
  GRADE_11: 'י"א',
  GRADE_12: 'י"ב',
};

/** יעד שעות רגיל לכל שכבה (null = אין דרישת מינימום). */
export const STANDARD_HOURS: Record<string, number | null> = {
  GRADE_10: 60,
  GRADE_11: 30,
  GRADE_12: null,
};

/** שעות נדרשות בכל שכבה לזכאות לתעודת בגרות חברתית. */
export const BAGRUT_PER_GRADE = 60;

export const semesterLabel: Record<string, string> = {
  A: "מחצית א'",
  B: "מחצית ב'",
};

export const roleLabel: Record<string, string> = {
  STUDENT: "תלמיד/ה",
  TEACHER: "מחנך/ת",
  ADMIN: "מנהל מערכת",
  SUPERVISOR: "אחראי מקום התנדבות",
};

/**
 * הרשמת תלמיד/ה. הכיתה נבחרת מרשימת הכיתות הקיימות במערכת,
 * ומתוכה נגזרים בשרת שם הכיתה, השכבה והמחנך/ת — ולכן אינם שדות בטופס.
 */
export const registerStudentSchema = z
  .object({
    first_name: z.string().trim().min(1, "שם פרטי הוא שדה חובה"),
    last_name: z.string().trim().min(1, "שם משפחה הוא שדה חובה"),
    national_id: z
      .string()
      .trim()
      .regex(/^\d{5,9}$/, "תעודת זהות חייבת להכיל 5-9 ספרות"),
    homeroom_teacher_id: z.coerce.number().int().positive("יש לבחור כיתה"),
    email: z.string().trim().email("כתובת אימייל אינה תקינה"),
    password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirm_password"],
  });

/** עריכת פרטי תלמיד/ה ע"י מנהל המערכת. */
export const updateStudentSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  first_name: z.string().trim().min(1, "שם פרטי הוא שדה חובה"),
  last_name: z.string().trim().min(1, "שם משפחה הוא שדה חובה"),
  national_id: z
    .string()
    .trim()
    .regex(/^\d{5,9}$/, "תעודת זהות חייבת להכיל 5-9 ספרות"),
  homeroom_teacher_id: z.coerce.number().int().positive("יש לבחור כיתה"),
  grade_level: z.enum(gradeLevels, {
    errorMap: () => ({ message: "יש לבחור שכבה" }),
  }),
  email: z.string().trim().email("כתובת אימייל אינה תקינה"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("כתובת אימייל אינה תקינה"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

export const hoursSchema = z.object({
  placement_id: z.coerce
    .number()
    .int()
    .positive("יש לבחור מקום התנדבות"),
  volunteer_date: z.string().min(1, "יש לבחור תאריך"),
  start_time: z.string().regex(/^\d{1,2}:\d{2}$/, "שעת התחלה אינה תקינה"),
  end_time: z.string().regex(/^\d{1,2}:\d{2}$/, "שעת סיום אינה תקינה"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const endPlacementSchema = z.object({
  placement_id: z.coerce.number().int().positive(),
});

export const placeSchema = z.object({
  place_name: z.string().trim().min(1, "שם מקום ההתנדבות הוא שדה חובה"),
  supervisor_name: z.string().trim().min(1, "שם האחראי הוא שדה חובה"),
  supervisor_phone: z
    .string()
    .trim()
    .regex(/^0\d{1,2}-?\d{7}$/, "מספר טלפון אינו תקין"),
  // אופציונלי — אם ימולא, הוא מקשר את המקום לחשבון "אחראי מקום התנדבות" קיים
  supervisor_email: z
    .string()
    .trim()
    .email("אימייל האחראי אינו תקין")
    .optional()
    .or(z.literal("")),
});

export const reflectionSchema = z.object({
  semester: z.enum(["A", "B"], {
    errorMap: () => ({ message: "יש לבחור מחצית" }),
  }),
  content: z.string().trim().min(10, "יש לכתוב לפחות 10 תווים ברפלקציה"),
});

export const evaluationSchema = z.object({
  student_id: z.coerce.number().int().positive("יש לבחור תלמיד/ה"),
  evaluation_text: z.string().trim().min(5, "יש לכתוב הערכה מילולית"),
});

export const createUserSchema = z.object({
  full_name: z.string().trim().min(1, "שם מלא הוא שדה חובה"),
  email: z.string().trim().email("אימייל אינו תקין"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  role: z.enum(["TEACHER", "SUPERVISOR"], {
    errorMap: () => ({ message: "יש לבחור תפקיד" }),
  }),
  // רלוונטיים למחנך/ת בלבד — נבדקים בפעולה עצמה
  class_name: z.string().trim().optional(),
  grade_level: z.enum(gradeLevels).optional(),
});

/** עדכון הכיתה והשכבה של מחנך/ת קיים/ת. */
export const updateTeacherClassSchema = z.object({
  teacher_id: z.coerce.number().int().positive(),
  class_name: z.string().trim().min(1, "שם הכיתה הוא שדה חובה"),
  grade_level: z.enum(gradeLevels, {
    errorMap: () => ({ message: "יש לבחור שכבה" }),
  }),
});

export const createAdminSchema = z.object({
  full_name: z.string().trim().min(1, "שם מלא הוא שדה חובה"),
  email: z.string().trim().email("אימייל אינו תקין"),
  password: z.string().min(6, "סיסמה זמנית חייבת להכיל לפחות 6 תווים"),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "יש להזין את הסיסמה הנוכחית"),
    new_password: z.string().min(6, "סיסמה חדשה חייבת להכיל לפחות 6 תווים"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirm_password"],
  })
  .refine((d) => d.new_password !== d.current_password, {
    message: "הסיסמה החדשה חייבת להיות שונה מהנוכחית",
    path: ["new_password"],
  });

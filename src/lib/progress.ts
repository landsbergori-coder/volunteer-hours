import { GradeLevel } from "@prisma/client";
import { STANDARD_HOURS, BAGRUT_PER_GRADE } from "@/lib/validation";

/** רשומת שעה מינימלית לחישובי התקדמות. */
export type HourLike = {
  calculated_hours: number;
  grade_level: GradeLevel | null;
};

/** סך שעות שדווחו בשכבה מסוימת (כולל fallback לשעות ישנות ללא שכבה). */
export function hoursInGrade(
  hours: HourLike[],
  grade: GradeLevel,
  fallbackGrade?: GradeLevel
): number {
  return hours.reduce((sum, h) => {
    const g = h.grade_level ?? fallbackGrade;
    return g === grade ? sum + h.calculated_hours : sum;
  }, 0);
}

export type GradeProgress = {
  done: number;
  target: number | null;
  pct: number; // 0..100 (100 אם אין יעד)
};

/** התקדמות בשכבה הנוכחית של התלמיד מול היעד הרגיל. */
export function currentGradeProgress(
  hours: HourLike[],
  currentGrade: GradeLevel
): GradeProgress {
  const done = Math.round(hoursInGrade(hours, currentGrade, currentGrade) * 10) / 10;
  const target = STANDARD_HOURS[currentGrade];
  const pct =
    target && target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 100;
  return { done, target, pct };
}

/** פירוט שעות לפי שלוש השכבות (לבגרות חברתית). */
export function bagrutBreakdown(hours: HourLike[]): {
  GRADE_10: number;
  GRADE_11: number;
  GRADE_12: number;
} {
  return {
    GRADE_10: Math.round(hoursInGrade(hours, "GRADE_10") * 10) / 10,
    GRADE_11: Math.round(hoursInGrade(hours, "GRADE_11") * 10) / 10,
    GRADE_12: Math.round(hoursInGrade(hours, "GRADE_12") * 10) / 10,
  };
}

/** זכאות לבגרות חברתית: לפחות 60 שעות בכל אחת מ-י'/י"א/י"ב. */
export function isBagrutEligible(hours: HourLike[]): boolean {
  const b = bagrutBreakdown(hours);
  return (
    b.GRADE_10 >= BAGRUT_PER_GRADE &&
    b.GRADE_11 >= BAGRUT_PER_GRADE &&
    b.GRADE_12 >= BAGRUT_PER_GRADE
  );
}

/** חישובי שעות התנדבות וולידציה. */

/** ממיר "HH:MM" לדקות מתחילת היום. מחזיר null אם לא תקין. */
export function timeToMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time?.trim() ?? "");
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export type HoursResult =
  | { ok: true; hours: number }
  | { ok: false; error: string };

/**
 * מחשב את מספר השעות העשרוני בין שעת התחלה לסיום.
 * דוחה אם הזמנים לא תקינים או אם הסיום אינו אחרי ההתחלה.
 */
export function calculateHours(startTime: string, endTime: string): HoursResult {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null) return { ok: false, error: "שעת התחלה אינה תקינה" };
  if (end === null) return { ok: false, error: "שעת סיום אינה תקינה" };
  if (end <= start)
    return {
      ok: false,
      error: "שעת הסיום חייבת להיות מאוחרת משעת ההתחלה",
    };
  const hours = (end - start) / 60;
  if (hours <= 0)
    return { ok: false, error: "מספר השעות חייב להיות גדול מאפס" };
  // עיגול לשתי ספרות אחרי הנקודה כדי למנוע שגיאות נקודה צפה
  return { ok: true, hours: Math.round(hours * 100) / 100 };
}

/** מציג מספר שעות בפורמט עשרוני נקי, לדוגמה 2.5 או 3 */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "0";
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** ולידציה של תאריך התנדבות (לא ריק, לא בעתיד הרחוק) */
export function isValidVolunteerDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  // לא מאפשרים תאריך עתידי
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d.getTime() <= today.getTime();
}

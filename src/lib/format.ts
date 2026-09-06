/** עוזרי פורמט תאריכים בעברית. */

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * סדר א-ב עברי לרשימות תלמידים: שם משפחה ואז שם פרטי.
 *
 * המיון נעשה ב-JS ולא ב-orderBy של המסד, כי סדר המיון של Postgres תלוי
 * ב-collation של בסיס הנתונים ואינו מבטיח סדר אלפביתי עברי נכון.
 */
export function compareByLastName(
  a: { first_name: string; last_name: string },
  b: { first_name: string; last_name: string }
): number {
  return (
    a.last_name.localeCompare(b.last_name, "he") ||
    a.first_name.localeCompare(b.first_name, "he")
  );
}

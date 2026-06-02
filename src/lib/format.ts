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

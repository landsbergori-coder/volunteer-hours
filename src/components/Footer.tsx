import { SCHOOL_NAME } from "@/lib/validation";

/** קרדיט גלובלי — מופיע בכל מסך. */
export function Footer() {
  return (
    <footer className="no-print py-4 text-center text-xs text-gray-400">
      <div className="font-medium text-gray-500">{SCHOOL_NAME}</div>
      <div>© כל הזכויות שמורות לאורי לנדסברג-כ&quot;ץ</div>
    </footer>
  );
}

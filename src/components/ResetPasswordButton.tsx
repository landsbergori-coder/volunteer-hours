"use client";

import { useState } from "react";
import { KeyRound, X } from "lucide-react";

/**
 * כפתור "איפוס סיסמה" שנפתח לטופס קצר להזנת סיסמה זמנית חדשה.
 * הפעולה שמתקבלת אחראית לאמת הרשאות ולכפות החלפה בכניסה הבאה.
 */
export function ResetPasswordButton({
  id,
  action,
}: {
  id: number;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
        title="איפוס סיסמה"
      >
        <KeyRound size={14} /> איפוס סיסמה
      </button>
    );

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input
        name="password"
        type="text"
        required
        minLength={6}
        placeholder="סיסמה זמנית חדשה"
        className="input w-40 py-1 text-xs"
        autoFocus
      />
      <button type="submit" className="btn-primary px-2 py-1 text-xs">
        איפוס
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-gray-400 hover:text-gray-700"
        title="ביטול"
      >
        <X size={16} />
      </button>
    </form>
  );
}

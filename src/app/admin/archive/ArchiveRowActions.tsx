"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { restoreUserAction, purgeArchivedUserAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";

export function ArchiveRowActions({
  userId,
  name,
}: {
  userId: number;
  name: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      <form action={restoreUserAction}>
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm text-brand-600 hover:underline"
        >
          <RotateCcw size={15} /> שחזור
        </button>
      </form>
      <ConfirmButton
        action={purgeArchivedUserAction}
        hidden={{ user_id: String(userId) }}
        className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm text-gray-400 hover:text-red-600 cursor-pointer"
        title="מחיקה לצמיתות"
        message={`למחוק לצמיתות את ${name}? פעולה זו אינה הפיכה וכל הנתונים יימחקו.`}
        confirmLabel="מחיקה לצמיתות"
      >
        <Trash2 size={15} /> מחיקה לצמיתות
      </ConfirmButton>
    </div>
  );
}

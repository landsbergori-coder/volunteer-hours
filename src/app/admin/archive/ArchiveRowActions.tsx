"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { restoreUserAction, purgeArchivedUserAction } from "@/actions/admin";

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
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <RotateCcw size={15} /> שחזור
        </button>
      </form>
      <form
        action={purgeArchivedUserAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `למחוק לצמיתות את ${name}? פעולה זו אינה הפיכה וכל הנתונים יימחקו.`
            )
          )
            e.preventDefault();
        }}
      >
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          title="מחיקה לצמיתות"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-600"
        >
          <Trash2 size={15} /> מחיקה לצמיתות
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { KeyRound, Trash2, X } from "lucide-react";
import { resetAdminPasswordAction, deleteAdminAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";

export function AdminRowActions({
  id,
  name,
  isSelf,
  canDelete,
}: {
  id: number;
  name: string;
  isSelf: boolean;
  canDelete: boolean;
}) {
  const [resetting, setResetting] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2">
      {resetting ? (
        <form action={resetAdminPasswordAction} className="flex items-center gap-1">
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
            onClick={() => setResetting(false)}
            className="text-gray-400 hover:text-gray-700"
            title="ביטול"
          >
            <X size={16} />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setResetting(true)}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
          title="איפוס סיסמה"
        >
          <KeyRound size={14} /> איפוס סיסמה
        </button>
      )}

      {isSelf ? (
        <span className="text-xs text-gray-400">(אתה)</span>
      ) : canDelete ? (
        <ConfirmButton
          action={deleteAdminAction}
          hidden={{ id: String(id) }}
          className="icon-btn hover:text-red-600"
          title="מחיקת מנהל"
          message={`למחוק את המנהל ${name}? פעולה זו אינה הפיכה.`}
          confirmLabel="מחיקה"
        >
          <Trash2 size={16} />
        </ConfirmButton>
      ) : (
        <button
          type="button"
          disabled
          title="חייב להישאר לפחות מנהל אחד"
          className="icon-btn opacity-40 cursor-not-allowed"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

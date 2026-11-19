"use client";

import { Trash2 } from "lucide-react";
import { resetAdminPasswordAction, deleteAdminAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ResetPasswordButton } from "@/components/ResetPasswordButton";

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
  return (
    <div className="flex items-center justify-end gap-2">
      <ResetPasswordButton id={id} action={resetAdminPasswordAction} />

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

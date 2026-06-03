"use client";

import { RotateCcw } from "lucide-react";
import { restoreAllArchivedAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";

export function RestoreAllButton() {
  return (
    <ConfirmButton
      action={restoreAllArchivedAction}
      className="btn-secondary"
      tone="primary"
      title="שחזור הכל"
      message="לשחזר את כל הפריטים מהארכיון?"
      confirmLabel="שחזור הכל"
    >
      <RotateCcw size={16} /> שחזור הכל
    </ConfirmButton>
  );
}

"use client";

import { RotateCcw } from "lucide-react";
import { restoreAllArchivedAction } from "@/actions/admin";

export function RestoreAllButton() {
  return (
    <form
      action={restoreAllArchivedAction}
      onSubmit={(e) => {
        if (!confirm("לשחזר את כל הפריטים מהארכיון?")) e.preventDefault();
      }}
    >
      <button type="submit" className="btn-secondary">
        <RotateCcw size={16} /> שחזור הכל
      </button>
    </form>
  );
}

"use client";

import { Archive } from "lucide-react";
import { ConfirmButton } from "@/components/ConfirmButton";

/** כפתור ארכוב (הפיך) עם מודאל אישור מעוצב. */
export function ArchiveButton({
  action,
  hidden,
  label,
  confirmMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden?: Record<string, string>;
  label: string;
  confirmMessage: string;
}) {
  return (
    <ConfirmButton
      action={action}
      hidden={hidden}
      className="btn-secondary w-full"
      tone="primary"
      title="העברה לארכיון"
      message={confirmMessage}
      confirmLabel="העברה לארכיון"
    >
      <Archive size={16} /> {label}
    </ConfirmButton>
  );
}

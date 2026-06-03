"use client";

import { Archive } from "lucide-react";

/** כפתור ארכוב (הפיך) עם אישור פשוט. */
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
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <button type="submit" className="btn-secondary w-full">
        <Archive size={16} /> {label}
      </button>
    </form>
  );
}

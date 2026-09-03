"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText = "שומר...",
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  /** שם/ערך שיישלחו ב-FormData כשלוחצים דווקא על הכפתור הזה (לטופס עם כמה כפתורי שליחה) */
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(className)}
      name={name}
      value={value}
    >
      {pending ? pendingText : children}
    </button>
  );
}

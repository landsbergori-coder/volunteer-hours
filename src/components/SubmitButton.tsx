"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText = "שומר...",
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clsx(className)}>
      {pending ? pendingText : children}
    </button>
  );
}

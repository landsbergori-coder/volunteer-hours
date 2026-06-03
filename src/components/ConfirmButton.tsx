"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import clsx from "clsx";

/**
 * כפתור שמפעיל פעולת שרת רק לאחר אישור במודאל מעוצב (במקום window.confirm).
 */
export function ConfirmButton({
  action,
  hidden,
  children,
  className,
  title,
  message,
  confirmLabel = "אישור",
  tone = "danger",
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden?: Record<string, string>;
  children: ReactNode;
  className?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      <form ref={formRef} action={action} className="hidden">
        {hidden &&
          Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
      </form>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  tone === "danger"
                    ? "bg-red-100 text-red-600"
                    : "bg-brand-100 text-brand-600"
                )}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <p className="mb-5 whitespace-pre-line text-sm text-gray-600">
              {message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                ביטול
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={tone === "danger" ? "btn-danger" : "btn-primary"}
                onClick={() => {
                  formRef.current?.requestSubmit();
                  setOpen(false);
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

/** טופס מחיקה מסוכן: כפתור המחיקה ננעל עד שמקלידים את ביטוי האישור המדויק. */
export function ConfirmDeleteForm({
  action,
  expected,
  hidden,
  buttonLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  expected: string;
  hidden?: Record<string, string>;
  buttonLabel: string;
}) {
  const [value, setValue] = useState("");
  const matches = value.trim() === expected;

  return (
    <form action={action} className="space-y-3">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <input type="hidden" name="confirm" value={value} />

      <div>
        <label className="label">
          לאישור, הקלד/י בדיוק:{" "}
          <span className="font-bold text-red-600">{expected}</span>
        </label>
        <input
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={expected}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={!matches}
        onClick={(e) => {
          if (!confirm("פעולה זו אינה הפיכה. להמשיך במחיקה?")) e.preventDefault();
        }}
        className="btn-danger w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <AlertTriangle size={16} /> {buttonLabel}
      </button>
    </form>
  );
}

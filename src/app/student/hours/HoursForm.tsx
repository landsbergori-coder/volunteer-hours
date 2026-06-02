"use client";

import { useActionState, useState } from "react";
import { addHoursAction } from "@/actions/student";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { calculateHours, formatHours } from "@/lib/hours";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function HoursForm({ disabled }: { disabled: boolean }) {
  const [state, formAction] = useActionState(addHoursAction, initialActionState);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const calc = start && end ? calculateHours(start, end) : null;

  return (
    <form action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      {disabled && (
        <Alert ok={false}>
          יש להגדיר מקום התנדבות פעיל לפני דיווח שעות.
        </Alert>
      )}

      <div>
        <label className="label">תאריך ההתנדבות</label>
        <input
          name="volunteer_date"
          type="date"
          className="input"
          disabled={disabled}
        />
        <Err msg={state.errors?.volunteer_date} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">שעת התחלה</label>
          <input
            name="start_time"
            type="time"
            className="input"
            disabled={disabled}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Err msg={state.errors?.start_time} />
        </div>
        <div>
          <label className="label">שעת סיום</label>
          <input
            name="end_time"
            type="time"
            className="input"
            disabled={disabled}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
          <Err msg={state.errors?.end_time} />
        </div>
      </div>

      <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm">
        מספר שעות מחושב:{" "}
        <span className="font-bold text-brand-700">
          {calc?.ok ? `${formatHours(calc.hours)} שעות` : "—"}
        </span>
        {calc && !calc.ok && (
          <span className="mr-2 text-red-600">({calc.error})</span>
        )}
      </div>

      <div>
        <label className="label">הערה על הפעילות (אופציונלי)</label>
        <textarea
          name="description"
          rows={2}
          className="input"
          disabled={disabled}
          placeholder="לדוגמה: עזרה בחלוקת מזון"
        />
      </div>

      <SubmitButton className="btn-primary w-full">שמירת דיווח</SubmitButton>
    </form>
  );
}

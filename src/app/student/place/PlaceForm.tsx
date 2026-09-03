"use client";

import { useActionState, useRef, useEffect } from "react";
import { addPlaceAction } from "@/actions/student";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

/** טופס הוספת מקום התנדבות פעיל (ניתן להוסיף כמה מקומות במקביל). */
export function PlaceForm({ hasActive }: { hasActive: boolean }) {
  const [state, formAction] = useActionState(addPlaceAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.errors ?? {};

  // ניקוי הטופס אחרי כל הוספה מוצלחת, כדי להקל על הוספת מקום נוסף.
  // התלות היא באובייקט המצב עצמו (ולא ב-state.ok) כדי שגם הוספה שנייה ברצף תנקה.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      <p className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        {hasActive
          ? "אפשר להתנדב בכמה מקומות במקביל — המקומות הפעילים הקיימים יישארו פעילים, ובדיווח שעות תבחר/י לאיזה מקום השעות שייכות."
          : "מתנדב/ת ביותר ממקום אחד? אפשר להוסיף כאן כמה מקומות התנדבות, וכולם יישארו פעילים במקביל."}
      </p>

      <div>
        <label className="label">שם מקום ההתנדבות</label>
        <input name="place_name" className="input" />
        <Err msg={e.place_name} />
      </div>

      <div>
        <label className="label">שם האחראי</label>
        <input name="supervisor_name" className="input" />
        <Err msg={e.supervisor_name} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">טלפון סלולרי של האחראי</label>
          <input
            name="supervisor_phone"
            type="tel"
            inputMode="tel"
            className="input"
            placeholder="050-1234567"
          />
          <Err msg={e.supervisor_phone} />
        </div>
        <div>
          <label className="label">אימייל של האחראי</label>
          <input name="supervisor_email" type="email" className="input" />
          <Err msg={e.supervisor_email} />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full">
        {hasActive ? "הוספת מקום התנדבות נוסף" : "הוספת מקום התנדבות"}
      </SubmitButton>
    </form>
  );
}

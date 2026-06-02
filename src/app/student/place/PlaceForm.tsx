"use client";

import { useActionState } from "react";
import { setPlaceAction } from "@/actions/student";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

type Active = {
  place_name: string;
  supervisor_name: string;
  supervisor_phone: string;
  supervisor_email: string;
} | null;

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function PlaceForm({ active }: { active: Active }) {
  const [state, formAction] = useActionState(setPlaceAction, initialActionState);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      {active && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          שמירת מקום חדש תסגור את המקום הפעיל הנוכחי (
          <strong>{active.place_name}</strong>) ותשמור אותו בהיסטוריה. כל השעות
          שדיווחת יישמרו.
        </div>
      )}

      <div>
        <label className="label">שם מקום ההתנדבות</label>
        <input
          name="place_name"
          className="input"
          defaultValue={active?.place_name ?? ""}
        />
        <Err msg={e.place_name} />
      </div>

      <div>
        <label className="label">שם האחראי</label>
        <input
          name="supervisor_name"
          className="input"
          defaultValue={active?.supervisor_name ?? ""}
        />
        <Err msg={e.supervisor_name} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">טלפון סלולרי של האחראי</label>
          <input
            name="supervisor_phone"
            className="input"
            placeholder="050-1234567"
            defaultValue={active?.supervisor_phone ?? ""}
          />
          <Err msg={e.supervisor_phone} />
        </div>
        <div>
          <label className="label">אימייל של האחראי</label>
          <input
            name="supervisor_email"
            type="email"
            className="input"
            defaultValue={active?.supervisor_email ?? ""}
          />
          <Err msg={e.supervisor_email} />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full">
        {active ? "שמירה ושינוי מקום" : "שמירת מקום התנדבות"}
      </SubmitButton>
    </form>
  );
}

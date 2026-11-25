"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updatePlaceSupervisorAction } from "@/actions/student";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

/** עריכת פרטי האחראי של מקום התנדבות פעיל, ישירות מכרטיס המקום. */
export function EditSupervisorForm({
  placementId,
  name,
  phone,
  email,
}: {
  placementId: number;
  name: string;
  phone: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    updatePlaceSupervisorAction,
    initialActionState
  );
  const e = state.errors ?? {};

  // סגירת הטופס אחרי שמירה מוצלחת
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open)
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
        >
          <Pencil size={12} /> עריכת פרטי האחראי
        </button>
        {state.ok && (
          <span className="text-xs text-green-600">{state.message}</span>
        )}
      </div>
    );

  return (
    <form
      action={formAction}
      className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
    >
      <input type="hidden" name="placement_id" value={placementId} />

      <div>
        <label className="label">שם האחראי</label>
        <input name="supervisor_name" className="input" defaultValue={name} />
        <Err msg={e.supervisor_name} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">טלפון סלולרי של האחראי</label>
          <input
            name="supervisor_phone"
            type="tel"
            inputMode="tel"
            className="input"
            defaultValue={phone}
          />
          <Err msg={e.supervisor_phone} />
        </div>
        <div>
          <label className="label">
            אימייל של האחראי{" "}
            <span className="font-normal text-gray-400">(לא חובה)</span>
          </label>
          <input
            name="supervisor_email"
            type="email"
            className="input"
            defaultValue={email}
          />
          <Err msg={e.supervisor_email} />
        </div>
      </div>

      {!state.ok && state.message && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton className="btn-primary text-sm" pendingText="שומר...">
          שמירה
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary text-sm"
        >
          <X size={14} /> ביטול
        </button>
      </div>
    </form>
  );
}

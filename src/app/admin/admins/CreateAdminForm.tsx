"use client";

import { useActionState } from "react";
import { createAdminAction } from "@/actions/admin";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function CreateAdminForm() {
  const [state, formAction] = useActionState(
    createAdminAction,
    initialActionState
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      <div>
        <label className="label">שם מלא</label>
        <input name="full_name" className="input" />
        <Err msg={e.full_name} />
      </div>

      <div>
        <label className="label">אימייל</label>
        <input name="email" type="email" className="input" />
        <Err msg={e.email} />
      </div>

      <div>
        <label className="label">סיסמה זמנית</label>
        <input name="password" type="text" className="input" placeholder="לפחות 6 תווים" />
        <Err msg={e.password} />
        <p className="mt-1 text-xs text-gray-400">
          המנהל החדש יתבקש להחליף את הסיסמה בכניסה הראשונה.
        </p>
      </div>

      <SubmitButton className="btn-primary w-full">יצירת מנהל</SubmitButton>
    </form>
  );
}

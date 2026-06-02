"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/actions/auth";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    initialActionState
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      <div>
        <label className="label">סיסמה נוכחית</label>
        <input name="current_password" type="password" className="input" autoComplete="current-password" />
        <Err msg={e.current_password} />
      </div>

      <div>
        <label className="label">סיסמה חדשה</label>
        <input name="new_password" type="password" className="input" autoComplete="new-password" />
        <Err msg={e.new_password} />
      </div>

      <div>
        <label className="label">אישור סיסמה חדשה</label>
        <input name="confirm_password" type="password" className="input" autoComplete="new-password" />
        <Err msg={e.confirm_password} />
      </div>

      <SubmitButton className="btn-primary w-full">שמירת סיסמה חדשה</SubmitButton>
    </form>
  );
}

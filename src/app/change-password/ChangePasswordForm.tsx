"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/actions/auth";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
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
        <label className="label" htmlFor="current_password">סיסמה נוכחית</label>
        <PasswordInput id="current_password" name="current_password" autoComplete="current-password" />
        <Err msg={e.current_password} />
      </div>

      <div>
        <label className="label" htmlFor="new_password">סיסמה חדשה</label>
        <PasswordInput id="new_password" name="new_password" autoComplete="new-password" />
        <Err msg={e.new_password} />
      </div>

      <div>
        <label className="label" htmlFor="confirm_password">אישור סיסמה חדשה</label>
        <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" />
        <Err msg={e.confirm_password} />
      </div>

      <SubmitButton className="btn-primary w-full">שמירת סיסמה חדשה</SubmitButton>
    </form>
  );
}

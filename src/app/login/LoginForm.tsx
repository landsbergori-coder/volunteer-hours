"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <Alert ok={false}>{state.message}</Alert>

      <div>
        <label className="label" htmlFor="email">
          אימייל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="name@example.com"
        />
        {state.errors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="password">
          סיסמה
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          placeholder="••••••"
        />
        {state.errors?.password && (
          <p className="mt-1 text-xs text-red-600">{state.errors.password}</p>
        )}
      </div>

      <SubmitButton className="btn-primary w-full" pendingText="מתחבר...">
        התחברות
      </SubmitButton>
    </form>
  );
}

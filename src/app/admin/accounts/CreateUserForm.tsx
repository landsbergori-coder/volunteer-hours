"use client";

import { useActionState, useState } from "react";
import { createUserAction } from "@/actions/admin";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUserAction, initialActionState);
  const [role, setRole] = useState("TEACHER");
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      <div>
        <label className="label">תפקיד</label>
        <select name="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="TEACHER">מחנך/ת</option>
          <option value="SUPERVISOR">אחראי מקום התנדבות</option>
        </select>
      </div>

      <div>
        <label className="label">שם מלא</label>
        <input name="full_name" className="input" />
        <Err msg={e.full_name} />
      </div>

      {role === "TEACHER" && (
        <div>
          <label className="label">שם הכיתה</label>
          <input name="class_name" className="input" placeholder="לדוגמה: י'3" />
          <Err msg={e.class_name} />
        </div>
      )}

      <div>
        <label className="label">אימייל</label>
        <input name="email" type="email" className="input" />
        <Err msg={e.email} />
      </div>

      <div>
        <label className="label">סיסמה</label>
        <input name="password" type="password" className="input" />
        <Err msg={e.password} />
      </div>

      <SubmitButton className="btn-primary w-full">יצירת חשבון</SubmitButton>
    </form>
  );
}

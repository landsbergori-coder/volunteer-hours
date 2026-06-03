"use client";

import { useActionState } from "react";
import { registerStudentAction } from "@/actions/auth";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { Alert } from "@/components/ui";

type Teacher = { id: number; full_name: string; class_name: string };

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function RegisterForm({ teachers }: { teachers: Teacher[] }) {
  const [state, formAction] = useActionState(
    registerStudentAction,
    initialActionState
  );
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Alert ok={false}>{state.message}</Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">שם פרטי</label>
          <input name="first_name" className="input" />
          <Err msg={e.first_name} />
        </div>
        <div>
          <label className="label">שם משפחה</label>
          <input name="last_name" className="input" />
          <Err msg={e.last_name} />
        </div>
      </div>

      <div>
        <label className="label">תעודת זהות</label>
        <input name="national_id" inputMode="numeric" className="input" />
        <Err msg={e.national_id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">שכבה</label>
          <select name="grade_level" className="input" defaultValue="">
            <option value="" disabled>
              בחר/י שכבה
            </option>
            <option value="GRADE_10">י'</option>
            <option value="GRADE_11">י&quot;א</option>
            <option value="GRADE_12">י&quot;ב</option>
          </select>
          <Err msg={e.grade_level} />
        </div>
        <div>
          <label className="label">כיתה</label>
          <input name="class_name" className="input" placeholder="לדוגמה: י'3" />
          <Err msg={e.class_name} />
        </div>
      </div>

      <div>
        <label className="label">מחנך/ת</label>
        <select name="homeroom_teacher_id" className="input" defaultValue="">
          <option value="" disabled>
            בחר/י מחנך/ת
          </option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name} ({t.class_name})
            </option>
          ))}
        </select>
        <Err msg={e.homeroom_teacher_id} />
      </div>

      <div>
        <label className="label">אימייל</label>
        <input name="email" type="email" className="input" />
        <Err msg={e.email} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">סיסמה</label>
          <PasswordInput id="password" name="password" autoComplete="new-password" />
          <Err msg={e.password} />
        </div>
        <div>
          <label className="label" htmlFor="confirm_password">אישור סיסמה</label>
          <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" />
          <Err msg={e.confirm_password} />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full" pendingText="נרשם...">
        הרשמה
      </SubmitButton>
    </form>
  );
}

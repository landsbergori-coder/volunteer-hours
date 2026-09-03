"use client";

import { useActionState } from "react";
import { registerStudentAction } from "@/actions/auth";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordInput } from "@/components/PasswordInput";
import { Alert } from "@/components/ui";
import { gradeLabel, gradeLevels } from "@/lib/validation";
import type { ClassOption } from "@/lib/queries";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function RegisterForm({ classes }: { classes: ClassOption[] }) {
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

      <div>
        <label className="label">כיתה</label>
        {classes.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            עדיין לא הוגדרו כיתות במערכת. יש לפנות למנהל/ת המערכת כדי שיוגדרו
            מחנכים וכיתות לפני ההרשמה.
          </p>
        ) : (
          <select name="homeroom_teacher_id" className="input" defaultValue="">
            <option value="" disabled>
              בחר/י כיתה
            </option>
            {gradeLevels
              .filter((g) => classes.some((c) => c.grade_level === g))
              .map((g) => (
                <optgroup key={g} label={`שכבה ${gradeLabel[g]}`}>
                  {classes
                    .filter((c) => c.grade_level === g)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name} · {c.full_name}
                      </option>
                    ))}
                </optgroup>
              ))}
          </select>
        )}
        <p className="mt-1 text-xs text-gray-500">
          הרשימה מציגה את הכיתות כפי שהוגדרו במערכת. השכבה והמחנך/ת נקבעים לפי
          הכיתה שנבחרה.
        </p>
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

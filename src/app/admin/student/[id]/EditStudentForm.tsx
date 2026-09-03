"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateStudentAction } from "@/actions/admin";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, SectionTitle, Alert } from "@/components/ui";
import { gradeLabel, gradeLevels } from "@/lib/validation";
import type { ClassOption } from "@/lib/queries";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export type StudentDetails = {
  id: number;
  first_name: string;
  last_name: string;
  national_id: string;
  grade_level: string;
  homeroom_teacher_id: number | null;
  email: string;
};

/** עריכת פרטי תלמיד/ה — מנהל מערכת בלבד. */
export function EditStudentForm({
  student,
  classes,
}: {
  student: StudentDetails;
  classes: ClassOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateStudentAction,
    initialActionState
  );
  const e = state.errors ?? {};

  if (!open)
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-secondary"
        >
          <Pencil size={16} /> עריכת פרטי התלמיד/ה
        </button>
        {state.ok && state.message && (
          <span className="text-sm text-green-600">{state.message}</span>
        )}
      </div>
    );

  return (
    <Card>
      <SectionTitle
        action={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="icon-btn hover:text-gray-800"
            title="סגירה"
          >
            <X size={18} />
          </button>
        }
      >
        עריכת פרטי התלמיד/ה
      </SectionTitle>

      <form action={formAction} className="space-y-4">
        {state.ok && <Alert ok>{state.message}</Alert>}
        {!state.ok && <Alert ok={false}>{state.message}</Alert>}

        <input type="hidden" name="student_id" value={student.id} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">שם פרטי</label>
            <input
              name="first_name"
              className="input"
              defaultValue={student.first_name}
            />
            <Err msg={e.first_name} />
          </div>
          <div>
            <label className="label">שם משפחה</label>
            <input
              name="last_name"
              className="input"
              defaultValue={student.last_name}
            />
            <Err msg={e.last_name} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">תעודת זהות</label>
            <input
              name="national_id"
              inputMode="numeric"
              className="input"
              defaultValue={student.national_id}
            />
            <Err msg={e.national_id} />
          </div>
          <div>
            <label className="label">אימייל</label>
            <input
              name="email"
              type="email"
              className="input"
              defaultValue={student.email}
            />
            <Err msg={e.email} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">כיתה</label>
            <select
              name="homeroom_teacher_id"
              className="input"
              defaultValue={student.homeroom_teacher_id ?? ""}
            >
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
            <Err msg={e.homeroom_teacher_id} />
          </div>
          <div>
            <label className="label">שכבה</label>
            <select
              name="grade_level"
              className="input"
              defaultValue={student.grade_level}
            >
              {gradeLevels.map((g) => (
                <option key={g} value={g}>
                  {gradeLabel[g]}
                </option>
              ))}
            </select>
            <Err msg={e.grade_level} />
            <p className="mt-1 text-xs text-gray-500">
              השכבה נשמרת בנפרד מהכיתה, כי בהעברת שנה השכבה מתקדמת בעוד שיוך
              הכיתה עשוי להישאר.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <SubmitButton className="btn-primary">שמירת השינויים</SubmitButton>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-secondary"
          >
            ביטול
          </button>
        </div>
      </form>
    </Card>
  );
}

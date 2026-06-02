"use client";

import { useActionState } from "react";
import { createEvaluationAction } from "@/actions/supervisor";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

type Option = { id: number; name: string };

export function EvaluationForm({ students }: { students: Option[] }) {
  const [state, formAction] = useActionState(
    createEvaluationAction,
    initialActionState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      <div>
        <label className="label">בחירת תלמיד/ה</label>
        <select name="student_id" className="input" defaultValue="">
          <option value="" disabled>
            בחר/י תלמיד/ה
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {state.errors?.student_id && (
          <p className="mt-1 text-xs text-red-600">{state.errors.student_id}</p>
        )}
      </div>

      <div>
        <label className="label">הערכה מילולית</label>
        <textarea
          name="evaluation_text"
          rows={6}
          className="input"
          placeholder="כתוב/כתבי הערכה על התלמיד/ה — מעורבות, אחריות, יחס..."
        />
        {state.errors?.evaluation_text && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.evaluation_text}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">תאריך ההערכה יישמר אוטומטית.</p>

      <SubmitButton className="btn-primary w-full">שמירת הערכה</SubmitButton>
    </form>
  );
}

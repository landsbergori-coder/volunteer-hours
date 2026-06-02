"use client";

import { useActionState, useState } from "react";
import { saveReflectionAction } from "@/actions/student";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/ui";

type Existing = { A?: string; B?: string };

export function ReflectionForm({ existing }: { existing: Existing }) {
  const [state, formAction] = useActionState(
    saveReflectionAction,
    initialActionState
  );
  const [semester, setSemester] = useState<"A" | "B">("A");
  const content = semester === "A" ? existing.A : existing.B;

  return (
    <form action={formAction} className="space-y-4">
      {state.ok && <Alert ok>{state.message}</Alert>}
      {!state.ok && <Alert ok={false}>{state.message}</Alert>}

      <div>
        <label className="label">בחירת מחצית</label>
        <select
          name="semester"
          className="input"
          value={semester}
          onChange={(e) => setSemester(e.target.value as "A" | "B")}
        >
          <option value="A">מחצית א&apos;</option>
          <option value="B">מחצית ב&apos;</option>
        </select>
        {state.errors?.semester && (
          <p className="mt-1 text-xs text-red-600">{state.errors.semester}</p>
        )}
      </div>

      <div>
        <label className="label">תוכן הרפלקציה</label>
        <textarea
          // key מאלץ רענון של ה-defaultValue בעת החלפת מחצית
          key={semester}
          name="content"
          rows={10}
          className="input"
          defaultValue={content ?? ""}
          placeholder="כתוב/כתבי על חוויית ההתנדבות שלך, מה למדת, ומה הרגשת..."
        />
        {state.errors?.content && (
          <p className="mt-1 text-xs text-red-600">{state.errors.content}</p>
        )}
      </div>

      <SubmitButton className="btn-primary w-full">
        {content ? "עדכון רפלקציה" : "שמירת רפלקציה"}
      </SubmitButton>
    </form>
  );
}

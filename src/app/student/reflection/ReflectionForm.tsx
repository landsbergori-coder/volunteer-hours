"use client";

import { useActionState, useState, useEffect } from "react";
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
  const [text, setText] = useState(content ?? "");
  const [dirty, setDirty] = useState(false);

  // עדכון השדה בעת החלפת מחצית
  useEffect(() => {
    setText((semester === "A" ? existing.A : existing.B) ?? "");
    setDirty(false);
  }, [semester, existing.A, existing.B]);

  // אזהרה לפני עזיבת הדף עם שינויים שלא נשמרו
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

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
        <label className="label" htmlFor="content">
          תוכן הרפלקציה
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          className="input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
          placeholder="כתוב/כתבי על חוויית ההתנדבות שלך, מה למדת, ומה הרגשת..."
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-red-600">{state.errors?.content ?? ""}</span>
          <span
            className={text.trim().length < 10 ? "text-gray-400" : "text-gray-500"}
          >
            {text.length} תווים{text.trim().length < 10 ? " (לפחות 10)" : ""}
          </span>
        </div>
      </div>

      <SubmitButton className="btn-primary w-full">
        {content ? "עדכון רפלקציה" : "שמירת רפלקציה"}
      </SubmitButton>
    </form>
  );
}

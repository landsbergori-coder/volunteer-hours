"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateTeacherClassAction } from "@/actions/admin";
import { initialActionState } from "@/lib/form";
import { SubmitButton } from "@/components/SubmitButton";
import { gradeLabel, gradeLevels } from "@/lib/validation";

/** עריכה מהירה של שם הכיתה והשכבה של מחנך/ת, ישירות משורת הטבלה. */
export function EditTeacherClassForm({
  teacherId,
  className,
  gradeLevel,
}: {
  teacherId: number;
  className: string;
  gradeLevel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateTeacherClassAction,
    initialActionState
  );

  if (!open)
    return (
      <div className="flex items-center gap-2">
        <span>
          {className}{" "}
          <span className="text-xs text-gray-400">
            (שכבה {gradeLabel[gradeLevel]})
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="icon-btn hover:text-brand-600"
          title="עריכת כיתה ושכבה"
        >
          <Pencil size={14} />
        </button>
        {state.ok && (
          <span className="text-xs text-green-600">{state.message}</span>
        )}
      </div>
    );

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="teacher_id" value={teacherId} />
      <div>
        <input
          name="class_name"
          className="input w-28"
          defaultValue={className}
          aria-label="שם הכיתה"
        />
        {state.errors?.class_name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.class_name}</p>
        )}
      </div>
      <select
        name="grade_level"
        className="input w-24"
        defaultValue={gradeLevel}
        aria-label="שכבה"
      >
        {gradeLevels.map((g) => (
          <option key={g} value={g}>
            {gradeLabel[g]}
          </option>
        ))}
      </select>
      <SubmitButton className="btn-primary text-sm" pendingText="שומר...">
        שמירה
      </SubmitButton>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="icon-btn hover:text-gray-800"
        title="ביטול"
      >
        <X size={16} />
      </button>
      {!state.ok && state.message && (
        <p className="w-full text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { deleteStudentAction } from "@/actions/admin";

export function DeleteStudentButton({
  studentId,
  name,
}: {
  studentId: number;
  name: string;
}) {
  return (
    <form
      action={deleteStudentAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `למחוק את התלמיד/ה ${name} ואת כל הנתונים (שעות, רפלקציות, הערכות)?\nפעולה זו אינה הפיכה.`
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="student_id" value={studentId} />
      <button type="submit" className="btn-danger">
        <Trash2 size={16} /> מחיקת תלמיד/ה
      </button>
    </form>
  );
}

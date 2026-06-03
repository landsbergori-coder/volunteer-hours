"use client";

import { Trash2, Archive } from "lucide-react";
import { deleteStudentAction, archiveStudentAction } from "@/actions/admin";

/** פעולות מסוכנות לכרטיס תלמיד: ארכיון (הפיך) או מחיקה לצמיתות. */
export function DeleteStudentButton({
  studentId,
  name,
}: {
  studentId: number;
  name: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <form action={archiveStudentAction}>
        <input type="hidden" name="student_id" value={studentId} />
        <button type="submit" className="btn-secondary">
          <Archive size={16} /> העברה לארכיון
        </button>
      </form>

      <form
        action={deleteStudentAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `למחוק לצמיתות את ${name} ואת כל הנתונים (שעות, רפלקציות, הערכות)?\nפעולה זו אינה הפיכה. לשמירת אפשרות שחזור — השתמש/י בארכיון.`
            )
          )
            e.preventDefault();
        }}
      >
        <input type="hidden" name="student_id" value={studentId} />
        <button type="submit" className="btn-danger">
          <Trash2 size={16} /> מחיקה לצמיתות
        </button>
      </form>
    </div>
  );
}

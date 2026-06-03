"use client";

import { Trash2, Archive } from "lucide-react";
import { deleteStudentAction, archiveStudentAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";

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
      <ConfirmButton
        action={archiveStudentAction}
        hidden={{ student_id: String(studentId) }}
        className="btn-secondary"
        tone="primary"
        title="העברה לארכיון"
        message={`להעביר את ${name} לארכיון? הנתונים יישמרו וניתן לשחזר בכל עת ממסך הארכיון.`}
        confirmLabel="העברה לארכיון"
      >
        <Archive size={16} /> העברה לארכיון
      </ConfirmButton>

      <ConfirmButton
        action={deleteStudentAction}
        hidden={{ student_id: String(studentId) }}
        className="btn-danger"
        title="מחיקה לצמיתות"
        message={`למחוק לצמיתות את ${name} ואת כל הנתונים (שעות, רפלקציות, הערכות)?\nפעולה זו אינה הפיכה. לשמירת אפשרות שחזור — השתמש/י בארכיון.`}
        confirmLabel="מחיקה לצמיתות"
      >
        <Trash2 size={16} /> מחיקה לצמיתות
      </ConfirmButton>
    </div>
  );
}

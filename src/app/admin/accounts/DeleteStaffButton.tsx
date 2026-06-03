"use client";

import { Trash2, Archive } from "lucide-react";
import { deleteStaffAction, archiveStaffAction } from "@/actions/admin";
import { ConfirmButton } from "@/components/ConfirmButton";

export function DeleteStaffButton({
  userId,
  name,
  studentCount,
}: {
  userId: number;
  name: string;
  studentCount?: number;
}) {
  const warn =
    studentCount && studentCount > 0
      ? `\n${studentCount} תלמידים יישארו ללא מחנך/ת (הנתונים שלהם יישמרו).`
      : "";
  return (
    <div className="flex items-center justify-end gap-1">
      <ConfirmButton
        action={archiveStaffAction}
        hidden={{ user_id: String(userId) }}
        className="icon-btn hover:text-amber-600"
        tone="primary"
        title="העברה לארכיון"
        message={`להעביר את ${name} לארכיון? ניתן לשחזר בכל עת.`}
        confirmLabel="העברה לארכיון"
      >
        <Archive size={16} />
      </ConfirmButton>
      <ConfirmButton
        action={deleteStaffAction}
        hidden={{ user_id: String(userId) }}
        className="icon-btn hover:text-red-600"
        title="מחיקה לצמיתות"
        message={`למחוק לצמיתות את ${name}?${warn}\nפעולה זו אינה הפיכה. לשמירת אפשרות שחזור — השתמש/י בארכיון.`}
        confirmLabel="מחיקה לצמיתות"
      >
        <Trash2 size={16} />
      </ConfirmButton>
    </div>
  );
}

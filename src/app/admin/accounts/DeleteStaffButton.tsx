"use client";

import { Trash2, Archive } from "lucide-react";
import { deleteStaffAction, archiveStaffAction } from "@/actions/admin";

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
    <div className="flex items-center justify-end gap-2">
      <form action={archiveStaffAction}>
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          title="העברה לארכיון (הפיך)"
          className="text-gray-400 hover:text-amber-600"
        >
          <Archive size={16} />
        </button>
      </form>
      <form
        action={deleteStaffAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `למחוק לצמיתות את ${name}?${warn}\nפעולה זו אינה הפיכה. לשמירת אפשרות שחזור — השתמש/י בארכיון.`
            )
          )
            e.preventDefault();
        }}
      >
        <input type="hidden" name="user_id" value={userId} />
        <button
          type="submit"
          title="מחיקה לצמיתות"
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </form>
    </div>
  );
}

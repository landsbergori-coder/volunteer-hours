"use client";

import { Trash2 } from "lucide-react";
import { deleteStaffAction } from "@/actions/admin";

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
    <form
      action={deleteStaffAction}
      onSubmit={(e) => {
        if (!confirm(`למחוק את ${name}?${warn}\nפעולה זו אינה הפיכה.`))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        title="מחיקה"
        className="text-gray-400 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}

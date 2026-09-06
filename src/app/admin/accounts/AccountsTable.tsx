"use client";

import { useMemo, useState, ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { roleLabel, gradeLevels } from "@/lib/validation";
import { lastNameOf } from "@/lib/format";
import { DeleteStaffButton } from "./DeleteStaffButton";
import { EditTeacherClassForm } from "./EditTeacherClassForm";

export type AccountRow = {
  userId: number;
  full_name: string;
  role: string;
  email: string;
  teacher: {
    id: number;
    class_name: string;
    grade_level: string;
    studentCount: number;
  } | null;
};

type SortKey = "name" | "role" | "email" | "class";
type Direction = "asc" | "desc";

/** מיקום השכבה בסדר הלימודי, למיון כיתות (י' לפני י"א לפני י"ב). */
function gradeIndex(grade: string): number {
  const i = gradeLevels.indexOf(grade as (typeof gradeLevels)[number]);
  return i === -1 ? gradeLevels.length : i;
}

export function AccountsTable({ rows }: { rows: AccountRow[] }) {
  const [sort, setSort] = useState<SortKey>("name");
  const [dir, setDir] = useState<Direction>("asc");

  /** לחיצה על אותה כותרת הופכת את הכיוון; על כותרת אחרת מתחילה מסדר עולה. */
  function toggle(key: SortKey) {
    if (key === sort) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDir("asc");
    }
  }

  const view = useMemo(() => {
    const sign = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort === "class") {
        // חשבונות ללא כיתה (אחראי מקום התנדבות) תמיד בסוף, בשני הכיוונים
        if (!a.teacher && !b.teacher) return 0;
        if (!a.teacher) return 1;
        if (!b.teacher) return -1;
        return (
          sign *
          (gradeIndex(a.teacher.grade_level) -
            gradeIndex(b.teacher.grade_level) ||
            // numeric — כדי ש-י'10 יבוא אחרי י'9 ולא אחרי י'1
            a.teacher.class_name.localeCompare(b.teacher.class_name, "he", {
              numeric: true,
            }))
        );
      }
      if (sort === "role")
        return (
          sign *
          (roleLabel[a.role].localeCompare(roleLabel[b.role], "he") ||
            a.full_name.localeCompare(b.full_name, "he"))
        );
      if (sort === "email")
        return sign * a.email.localeCompare(b.email, "he");
      // ברירת המחדל: שם משפחה ואז השם המלא
      return (
        sign *
        (lastNameOf(a.full_name).localeCompare(lastNameOf(b.full_name), "he") ||
          a.full_name.localeCompare(b.full_name, "he"))
      );
    });
  }, [rows, sort, dir]);

  function SortHeader({
    id,
    children,
    className,
  }: {
    id: SortKey;
    children: ReactNode;
    className?: string;
  }) {
    const active = sort === id;
    return (
      <th
        className={className ?? "py-2 font-medium"}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => toggle(id)}
          className={`inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-gray-900 ${
            active ? "font-bold text-brand-700" : ""
          }`}
        >
          {children}
          {active ? (
            dir === "asc" ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )
          ) : (
            <ChevronsUpDown size={14} className="text-gray-300" />
          )}
        </button>
      </th>
    );
  }

  if (rows.length === 0)
    return <EmptyState>עדיין לא נוצרו חשבונות.</EmptyState>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        לחיצה על כותרת עמודה ממיינת לפיה; לחיצה נוספת הופכת את הסדר.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="text-xs text-gray-500">
            <tr className="border-b">
              <SortHeader id="name">שם</SortHeader>
              <SortHeader id="role">תפקיד</SortHeader>
              <SortHeader id="email">אימייל</SortHeader>
              <SortHeader id="class">כיתה ושכבה</SortHeader>
              <th className="py-2 text-left font-medium">מחיקה</th>
            </tr>
          </thead>
          <tbody>
            {view.map((u) => (
              <tr key={u.userId} className="border-b last:border-0">
                <td className="py-2 font-medium">{u.full_name}</td>
                <td className="py-2">
                  <Badge tone={u.role === "TEACHER" ? "blue" : "amber"}>
                    {roleLabel[u.role]}
                  </Badge>
                </td>
                <td className="py-2 text-gray-500">{u.email}</td>
                <td className="py-2">
                  {u.teacher ? (
                    <EditTeacherClassForm
                      teacherId={u.teacher.id}
                      className={u.teacher.class_name}
                      gradeLevel={u.teacher.grade_level}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2">
                  <div className="flex justify-end">
                    <DeleteStaffButton
                      userId={u.userId}
                      name={u.full_name}
                      studentCount={u.teacher?.studentCount}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

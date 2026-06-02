"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { formatHours } from "@/lib/hours";

export type TeacherRow = {
  id: number;
  name: string;
  national_id: string;
  place: string | null;
  supervisor: string | null;
  supervisorPhone: string | null;
  supervisorEmail: string | null;
  totalHours: number;
  reflA: boolean;
  reflB: boolean;
};

type SortKey = "name" | "hours" | "place";
type FilterKey = "all" | "noReflection" | "lowHours";

export function StudentsTable({
  rows,
  classAverage,
}: {
  rows: TeacherRow[];
  classAverage: number;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [filter, setFilter] = useState<FilterKey>("all");

  const lowThreshold = classAverage * 0.5;

  const view = useMemo(() => {
    let r = rows.filter((x) =>
      x.name.toLowerCase().includes(q.trim().toLowerCase())
    );
    if (filter === "noReflection") r = r.filter((x) => !x.reflA || !x.reflB);
    if (filter === "lowHours")
      r = r.filter((x) => x.totalHours < lowThreshold);

    r = [...r].sort((a, b) => {
      if (sort === "hours") return b.totalHours - a.totalHours;
      if (sort === "place")
        return (a.place ?? "").localeCompare(b.place ?? "", "he");
      return a.name.localeCompare(b.name, "he");
    });
    return r;
  }, [rows, q, sort, filter, lowThreshold]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pr-9"
            placeholder="חיפוש לפי שם תלמיד..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="name">מיון: שם</option>
          <option value="hours">מיון: מספר שעות</option>
          <option value="place">מיון: מקום התנדבות</option>
        </select>
        <select
          className="input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterKey)}
        >
          <option value="all">כל התלמידים</option>
          <option value="noReflection">לא מילאו רפלקציה</option>
          <option value="lowHours">מעט שעות יחסית לכיתה</option>
        </select>
      </div>

      {view.length === 0 ? (
        <EmptyState>לא נמצאו תלמידים מתאימים.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 font-medium">שם</th>
                <th className="py-2 font-medium">ת&quot;ז</th>
                <th className="py-2 font-medium">מקום התנדבות</th>
                <th className="py-2 font-medium">אחראי</th>
                <th className="py-2 font-medium">שעות</th>
                <th className="py-2 font-medium">מחצית א&apos;</th>
                <th className="py-2 font-medium">מחצית ב&apos;</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {view.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2 text-gray-500">{s.national_id}</td>
                  <td className="py-2">{s.place ?? "—"}</td>
                  <td className="py-2 text-gray-500">
                    {s.supervisor ? (
                      <span title={`${s.supervisorPhone} · ${s.supervisorEmail}`}>
                        {s.supervisor}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 font-semibold">
                    {formatHours(s.totalHours)}
                  </td>
                  <td className="py-2">
                    {s.reflA ? (
                      <Badge tone="green">הוגשה</Badge>
                    ) : (
                      <Badge tone="red">חסר</Badge>
                    )}
                  </td>
                  <td className="py-2">
                    {s.reflB ? (
                      <Badge tone="green">הוגשה</Badge>
                    ) : (
                      <Badge tone="red">חסר</Badge>
                    )}
                  </td>
                  <td className="py-2">
                    <Link
                      href={`/teacher/student/${s.id}`}
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                    >
                      <Eye size={16} /> כרטיס
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

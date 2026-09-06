"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Eye, ChevronLeft } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { ProgressBar } from "@/components/ProgressBar";
import { BagrutTrophy } from "@/components/BagrutTrophy";
import { formatHours } from "@/lib/hours";
import { compareByLastName } from "@/lib/format";

export type TeacherPlace = {
  name: string;
  supervisor: string;
  phone: string;
  email: string;
};

export type TeacherRow = {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  national_id: string;
  /** כל מקומות ההתנדבות הפעילים — תלמיד/ה יכול/ה להתנדב בכמה מקומות במקביל */
  places: TeacherPlace[];
  totalHours: number;
  gradeDone: number;
  gradeTarget: number | null;
  bagrutEligible: boolean;
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
  const router = useRouter();
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
        return (a.places[0]?.name ?? "").localeCompare(
          b.places[0]?.name ?? "",
          "he"
        );
      return compareByLastName(a, b);
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
          <option value="name">מיון: שם משפחה</option>
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
        <>
          {/* דסקטופ: טבלה */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-2 font-medium">שם</th>
                  <th className="py-2 font-medium">ת&quot;ז</th>
                  <th className="py-2 font-medium">מקום התנדבות</th>
                  <th className="py-2 font-medium">אחראי</th>
                  <th className="py-2 font-medium">שעות</th>
                  <th className="py-2 font-medium">התקדמות (שכבה)</th>
                  <th className="py-2 font-medium">מחצית א&apos;</th>
                  <th className="py-2 font-medium">מחצית ב&apos;</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {view.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/teacher/student/${s.id}`)}
                    className="cursor-pointer border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-2">
                      <span className="flex items-center gap-2 font-medium">
                        <Avatar name={s.name} size="sm" />
                        {s.name}
                        {s.bagrutEligible && <BagrutTrophy compact />}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{s.national_id}</td>
                    <td className="py-2">
                      {s.places.length === 0 ? (
                        "—"
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {s.places.map((p) => (
                            <Badge key={p.name} tone="blue">
                              {p.name}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500">
                      {s.places.length === 0
                        ? "—"
                        : s.places.map((p, i) => (
                            <span
                              key={p.name}
                              title={[p.phone, p.email]
                                .filter(Boolean)
                                .join(" · ")}
                            >
                              {i > 0 && ", "}
                              {p.supervisor}
                            </span>
                          ))}
                    </td>
                    <td className="py-2 font-semibold">
                      {formatHours(s.totalHours)}
                    </td>
                    <td className="py-2" onClick={(e) => e.stopPropagation()}>
                      <ProgressBar done={s.gradeDone} target={s.gradeTarget} compact />
                    </td>
                    <td className="py-2">
                      <Badge tone={s.reflA ? "green" : "red"}>
                        {s.reflA ? "הוגשה" : "חסר"}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge tone={s.reflB ? "green" : "red"}>
                        {s.reflB ? "הוגשה" : "חסר"}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1 text-brand-600">
                        <Eye size={16} /> כרטיס
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* מובייל: כרטיסים */}
          <div className="space-y-3 md:hidden">
            {view.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/student/${s.id}`}
                className="block rounded-xl border border-gray-100 p-3 active:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold">
                    <Avatar name={s.name} size="sm" />
                    {s.name}
                    {s.bagrutEligible && <BagrutTrophy compact />}
                  </span>
                  <ChevronLeft size={18} className="text-gray-400" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-500">
                  <span>ת&quot;ז: {s.national_id}</span>
                  <span className="font-semibold text-gray-700">
                    {formatHours(s.totalHours)} שעות
                  </span>
                  <span className="col-span-2">
                    {s.places.length > 1 ? "מקומות" : "מקום"}:{" "}
                    {s.places.map((p) => p.name).join(", ") || "—"}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar done={s.gradeDone} target={s.gradeTarget} />
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <Badge tone={s.reflA ? "green" : "red"}>
                    מחצית א&apos;: {s.reflA ? "✓" : "חסר"}
                  </Badge>
                  <Badge tone={s.reflB ? "green" : "red"}>
                    מחצית ב&apos;: {s.reflB ? "✓" : "חסר"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

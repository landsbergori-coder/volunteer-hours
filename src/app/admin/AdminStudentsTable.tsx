"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye, FileSpreadsheet, FileText } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { gradeLabel } from "@/lib/validation";

export type AdminRow = {
  id: number;
  name: string;
  national_id: string;
  grade_level: string;
  class_name: string;
  teacher: string;
  place: string | null;
  totalHours: number;
  reflA: boolean;
  reflB: boolean;
  hasEvaluation: boolean;
};

export function AdminStudentsTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("all");
  const [cls, setCls] = useState("all");
  const [teacher, setTeacher] = useState("all");
  const [place, setPlace] = useState("all");
  const [minH, setMinH] = useState("");
  const [maxH, setMaxH] = useState("");
  const [refl, setRefl] = useState("all");

  const classes = useMemo(
    () => [...new Set(rows.map((r) => r.class_name))].sort((a, b) => a.localeCompare(b, "he")),
    [rows]
  );
  const teachers = useMemo(
    () => [...new Set(rows.map((r) => r.teacher))].sort((a, b) => a.localeCompare(b, "he")),
    [rows]
  );
  const places = useMemo(
    () => [...new Set(rows.map((r) => r.place).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "he")),
    [rows]
  );

  const view = useMemo(() => {
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (grade !== "all" && r.grade_level !== grade) return false;
      if (cls !== "all" && r.class_name !== cls) return false;
      if (teacher !== "all" && r.teacher !== teacher) return false;
      if (place !== "all" && r.place !== place) return false;
      if (minH && r.totalHours < Number(minH)) return false;
      if (maxH && r.totalHours > Number(maxH)) return false;
      if (refl === "complete" && !(r.reflA && r.reflB)) return false;
      if (refl === "incomplete" && r.reflA && r.reflB) return false;
      return true;
    });
  }, [rows, q, grade, cls, teacher, place, minH, maxH, refl]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pr-9" placeholder="חיפוש שם..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <a href="/api/export?format=csv" className="btn-secondary">
            <FileText size={16} /> CSV
          </a>
          <a href="/api/export?format=xlsx" className="btn-secondary">
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="all">כל השכבות</option>
          <option value="GRADE_10">י&apos;</option>
          <option value="GRADE_11">י&quot;א</option>
        </select>
        <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="all">כל הכיתות</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
          <option value="all">כל המחנכים</option>
          {teachers.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="input" value={place} onChange={(e) => setPlace(e.target.value)}>
          <option value="all">כל מקומות ההתנדבות</option>
          {places.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="input" value={refl} onChange={(e) => setRefl(e.target.value)}>
          <option value="all">כל הרפלקציות</option>
          <option value="complete">השלימו את שתיהן</option>
          <option value="incomplete">חסרה רפלקציה</option>
        </select>
        <div className="flex items-center gap-1">
          <input className="input" type="number" min="0" placeholder="שעות מ-" value={minH} onChange={(e) => setMinH(e.target.value)} />
          <input className="input" type="number" min="0" placeholder="עד" value={maxH} onChange={(e) => setMaxH(e.target.value)} />
        </div>
      </div>

      <div className="text-xs text-gray-500">מציג {view.length} מתוך {rows.length} תלמידים</div>

      {view.length === 0 ? (
        <EmptyState>לא נמצאו תלמידים מתאימים לסינון.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 font-medium">שם</th>
                <th className="py-2 font-medium">ת&quot;ז</th>
                <th className="py-2 font-medium">שכבה</th>
                <th className="py-2 font-medium">כיתה</th>
                <th className="py-2 font-medium">מחנך/ת</th>
                <th className="py-2 font-medium">מקום</th>
                <th className="py-2 font-medium">שעות</th>
                <th className="py-2 font-medium">רפלקציות</th>
                <th className="py-2 font-medium">הערכה</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {view.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2 text-gray-500">{s.national_id}</td>
                  <td className="py-2">{gradeLabel[s.grade_level]}</td>
                  <td className="py-2">{s.class_name}</td>
                  <td className="py-2 text-gray-500">{s.teacher}</td>
                  <td className="py-2">{s.place ?? "—"}</td>
                  <td className="py-2 font-semibold">{formatHours(s.totalHours)}</td>
                  <td className="py-2">
                    <span className="flex gap-1">
                      <Badge tone={s.reflA ? "green" : "red"}>א&apos;</Badge>
                      <Badge tone={s.reflB ? "green" : "red"}>ב&apos;</Badge>
                    </span>
                  </td>
                  <td className="py-2">
                    {s.hasEvaluation ? <Badge tone="green">יש</Badge> : <Badge tone="gray">אין</Badge>}
                  </td>
                  <td className="py-2">
                    <Link href={`/admin/student/${s.id}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline">
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

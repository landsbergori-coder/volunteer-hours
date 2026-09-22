"use client";

import { useMemo, useState } from "react";
import { Search, FileSpreadsheet } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import type { PlaceSummary } from "@/lib/queries";

/** רשימת כל מקומות ההתנדבות, עם חיפוש והורדה לאקסל. */
export function PlacesTable({ places }: { places: PlaceSummary[] }) {
  const [q, setQ] = useState("");

  const view = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return places;
    return places.filter(
      (p) =>
        p.place_name.toLowerCase().includes(term) ||
        p.supervisor_name.toLowerCase().includes(term) ||
        p.activeStudents.some((s) => s.name.toLowerCase().includes(term))
    );
  }, [places, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pr-9"
            placeholder="חיפוש לפי מקום, אחראי או תלמיד/ה..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <a href="/api/export/places" className="btn-secondary">
          <FileSpreadsheet size={16} /> הורדה לאקסל
        </a>
      </div>

      <div className="text-xs text-gray-500">
        מציג {view.length} מתוך {places.length} מקומות
      </div>

      {view.length === 0 ? (
        <EmptyState>
          {places.length === 0
            ? "עדיין לא הוגדרו מקומות התנדבות."
            : "לא נמצאו מקומות מתאימים לחיפוש."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 font-medium">מקום</th>
                <th className="py-2 font-medium">אחראי</th>
                <th className="py-2 font-medium">טלפון</th>
                <th className="py-2 font-medium">אימייל</th>
                <th className="py-2 font-medium">תלמידים פעילים</th>
                <th className="py-2 font-medium">סה&quot;כ שעות</th>
              </tr>
            </thead>
            <tbody>
              {view.map((p) => (
                <tr key={p.id} className="border-b align-top last:border-0">
                  <td className="py-2 font-medium">{p.place_name}</td>
                  <td className="py-2">
                    <span className="flex flex-wrap items-center gap-1">
                      {p.supervisor_name}
                      {p.hasSupervisorAccount && (
                        <Badge tone="green">חשבון במערכת</Badge>
                      )}
                    </span>
                  </td>
                  <td className="py-2 whitespace-nowrap text-gray-500" dir="ltr">
                    {p.supervisor_phone}
                  </td>
                  <td className="py-2 text-gray-500">
                    {p.supervisor_email || "—"}
                  </td>
                  <td className="py-2">
                    {p.activeStudents.length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-brand-600">
                          {p.activeStudents.length} תלמידים
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                          {p.activeStudents.map((s) => (
                            <li key={s.name + s.class_name}>
                              {s.name}{" "}
                              <span className="text-gray-400">({s.class_name})</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                  <td className="py-2 font-semibold tabular-nums">
                    {formatHours(p.totalHours)}
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

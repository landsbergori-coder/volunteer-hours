import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, StatCard, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { formatDate, compareByLastName } from "@/lib/format";
import { gradeLabel } from "@/lib/validation";
import { Role } from "@prisma/client";
import { Users, MapPin } from "lucide-react";
import { EvaluationForm } from "./EvaluationForm";

export default async function SupervisorDashboard() {
  const session = await requireRole(Role.SUPERVISOR);

  // המקומות שבאחריות המשתמש
  const places = await prisma.volunteerPlace.findMany({
    where: { supervisor_user_id: session.userId },
    include: {
      placements: {
        where: { is_active: true, student: { user: { archived_at: null } } },
        include: {
          student: {
            include: {
              homeroom_teacher: { select: { full_name: true } },
              hours: {
                include: { volunteer_place: { select: { id: true } } },
                orderBy: { volunteer_date: "desc" },
              },
              evaluations: {
                where: { supervisor_user_id: session.userId },
                orderBy: { evaluation_date: "desc" },
              },
            },
          },
        },
      },
    },
  });

  const placeIds = new Set(places.map((p) => p.id));

  // איסוף התלמידים (ייתכן אותו תלמיד במספר מקומות — נשתמש ב-Map)
  type Row = {
    studentId: number;
    name: string;
    first_name: string;
    last_name: string;
    grade: string;
    teacher: string;
    placeName: string;
    hoursHere: number;
    reports: {
      id: number;
      date: Date;
      start: string;
      end: string;
      hours: number;
      desc: string | null;
    }[];
    evaluations: { id: number; text: string; date: Date }[];
  };

  const rows: Row[] = [];
  for (const place of places) {
    for (const pl of place.placements) {
      const s = pl.student;
      const hoursHere = s.hours.filter((h) =>
        placeIds.has(h.volunteer_place.id) && h.volunteer_place.id === place.id
      );
      rows.push({
        studentId: s.id,
        name: `${s.first_name} ${s.last_name}`,
        first_name: s.first_name,
        last_name: s.last_name,
        grade: gradeLabel[s.grade_level],
        teacher: s.homeroom_teacher?.full_name ?? "—",
        placeName: place.place_name,
        hoursHere: hoursHere.reduce((sum, h) => sum + h.calculated_hours, 0),
        reports: hoursHere.map((h) => ({
          id: h.id,
          date: h.volunteer_date,
          start: h.start_time,
          end: h.end_time,
          hours: h.calculated_hours,
          desc: h.description,
        })),
        evaluations: s.evaluations.map((e) => ({
          id: e.id,
          text: e.evaluation_text,
          date: e.evaluation_date,
        })),
      });
    }
  }

  rows.sort(compareByLastName);
  const studentOptions = rows.map((r) => ({ id: r.studentId, name: r.name }));
  const placeNames = places.map((p) => p.place_name).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">שלום, {session.name}</h1>
        <p className="text-sm text-gray-500">
          {placeNames || "טרם שויכו אליך מקומות התנדבות"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="מקומות באחריותך" value={places.length} icon={<MapPin size={22} />} />
        <StatCard label="תלמידים פעילים" value={rows.length} icon={<Users size={22} />} />
      </div>

      {places.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            עדיין לא שויכת לאף מקום התנדבות. השיוך מתבצע אוטומטית כאשר תלמיד מזין
            את כתובת האימייל שלך בפרטי מקום ההתנדבות שלו.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <SectionTitle>הזנת הערכה</SectionTitle>
            {studentOptions.length === 0 ? (
              <EmptyState>אין תלמידים פעילים להערכה.</EmptyState>
            ) : (
              <EvaluationForm students={studentOptions} />
            )}
          </Card>

          <div className="space-y-6 lg:col-span-2">
            {rows.length === 0 ? (
              <Card>
                <EmptyState>אין תלמידים משויכים למקומות שלך כרגע.</EmptyState>
              </Card>
            ) : (
              rows.map((r) => (
                <Card key={`${r.studentId}-${r.placeName}`}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold">{r.name}</h3>
                      <p className="text-xs text-gray-500">
                        שכבה {r.grade} · מחנך/ת: {r.teacher} · {r.placeName}
                      </p>
                    </div>
                    <Badge tone="blue">
                      {formatHours(r.hoursHere)} שעות במקום
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 text-xs font-medium text-gray-500">
                      דיווחי שעות במקום ({r.reports.length})
                    </div>
                    {r.reports.length === 0 ? (
                      <EmptyState>אין דיווחים.</EmptyState>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                          <tbody>
                            {r.reports.map((rep) => (
                              <tr key={rep.id} className="border-b last:border-0">
                                <td className="py-1.5">{formatDate(rep.date)}</td>
                                <td className="py-1.5 text-gray-500">
                                  {rep.start}–{rep.end}
                                </td>
                                <td className="py-1.5 font-semibold">
                                  {formatHours(rep.hours)} ש&apos;
                                </td>
                                <td className="py-1.5 text-gray-500">
                                  {rep.desc || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {r.evaluations.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-gray-500">
                        הערכות קודמות
                      </div>
                      <ul className="space-y-2">
                        {r.evaluations.map((ev) => (
                          <li
                            key={ev.id}
                            className="rounded-lg bg-gray-50 p-3 text-sm"
                          >
                            <p className="whitespace-pre-wrap text-gray-700">
                              {ev.text}
                            </p>
                            <div className="mt-1 text-xs text-gray-400">
                              {formatDate(ev.date)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminStats } from "@/lib/stats";
import { Card, StatCard, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { Role } from "@prisma/client";
import { Users, Clock, MapPin, TrendingUp, FileSpreadsheet } from "lucide-react";
import { gradeLabel } from "@/lib/validation";
import { AdminStudentsTable, AdminRow } from "./AdminStudentsTable";

export default async function AdminDashboard() {
  await requireRole(Role.ADMIN);
  const stats = await getAdminStats();

  const students = await prisma.student.findMany({
    where: { user: { archived_at: null } },
    include: {
      homeroom_teacher: { select: { full_name: true } },
      hours: { select: { calculated_hours: true } },
      reflections: { select: { semester: true } },
      evaluations: { select: { id: true } },
      placements: {
        where: { is_active: true },
        include: { volunteer_place: { select: { place_name: true } } },
      },
    },
    orderBy: { last_name: "asc" },
  });

  const rows: AdminRow[] = students.map((s) => {
    const total = s.hours.reduce((sum, h) => sum + h.calculated_hours, 0);
    const sem = new Set(s.reflections.map((r) => r.semester));
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      national_id: s.national_id,
      grade_level: s.grade_level,
      class_name: s.class_name,
      teacher: s.homeroom_teacher?.full_name ?? "—",
      place: s.placements[0]?.volunteer_place.place_name ?? null,
      totalHours: total,
      reflA: sem.has("A"),
      reflB: sem.has("B"),
      hasEvaluation: s.evaluations.length > 0,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">סקירה כללית — מנהל מערכת</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="מספר תלמידים" value={stats.studentCount} icon={<Users size={22} />} />
        <StatCard label="סך שעות התנדבות" value={`${formatHours(stats.totalHours)}`} icon={<Clock size={22} />} />
        <StatCard label="ממוצע שעות לתלמיד" value={`${formatHours(stats.avgHoursPerStudent)}`} icon={<TrendingUp size={22} />} />
        <StatCard label="מקומות התנדבות" value={stats.placeCount} icon={<MapPin size={22} />} />
      </div>

      <Card>
        <SectionTitle>ייצוא רפלקציות והערכות אחראי</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <a href="/api/export/reflections?scope=all" className="btn-secondary">
            <FileSpreadsheet size={16} /> כל התלמידים
          </a>
          <a
            href="/api/export/reflections?scope=grade&value=GRADE_10"
            className="btn-secondary"
          >
            <FileSpreadsheet size={16} /> שכבה {gradeLabel.GRADE_10}
          </a>
          <a
            href="/api/export/reflections?scope=grade&value=GRADE_11"
            className="btn-secondary"
          >
            <FileSpreadsheet size={16} /> שכבה {gradeLabel.GRADE_11}
          </a>
        </div>
      </Card>

      <Card>
        <SectionTitle>כל התלמידים</SectionTitle>
        <AdminStudentsTable rows={rows} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>ממוצע שעות לפי כיתה</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-2 font-medium">כיתה</th>
                  <th className="py-2 font-medium">תלמידים</th>
                  <th className="py-2 font-medium">סך שעות</th>
                  <th className="py-2 font-medium">ממוצע לתלמיד</th>
                </tr>
              </thead>
              <tbody>
                {stats.classStats.map((c) => (
                  <tr key={c.class_name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{c.class_name}</td>
                    <td className="py-2">{c.studentCount}</td>
                    <td className="py-2">{formatHours(c.totalHours)}</td>
                    <td className="py-2 font-semibold">{formatHours(c.avgHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle>מקומות התנדבות ומספר מתנדבים</SectionTitle>
          {stats.placeStats.length === 0 ? (
            <EmptyState>אין מקומות התנדבות פעילים.</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.placeStats.map((p) => (
                <li key={p.place_name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <span>{p.place_name}</span>
                  <Badge tone="blue">{p.studentCount} תלמידים</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>
            <span className="flex items-center gap-2">
              תלמידים ללא דיווח שעות
              <Badge tone="red">{stats.studentsWithoutHours.length}</Badge>
            </span>
          </SectionTitle>
          {stats.studentsWithoutHours.length === 0 ? (
            <EmptyState>כל התלמידים דיווחו שעות. 🎉</EmptyState>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats.studentsWithoutHours.map((s) => (
                <li key={s.id} className="flex justify-between border-b py-1.5 last:border-0">
                  <span>{s.name}</span>
                  <span className="text-gray-400">{s.class_name}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle>
            <span className="flex items-center gap-2">
              תלמידים ללא רפלקציה
              <Badge tone="amber">{stats.studentsWithoutReflection.length}</Badge>
            </span>
          </SectionTitle>
          {stats.studentsWithoutReflection.length === 0 ? (
            <EmptyState>כל התלמידים מילאו רפלקציות. 🎉</EmptyState>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats.studentsWithoutReflection.map((s) => (
                <li key={s.id} className="flex justify-between border-b py-1.5 last:border-0">
                  <span>{s.name} <span className="text-gray-400">({s.class_name})</span></span>
                  <span className="text-amber-600">חסר: {s.missing}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

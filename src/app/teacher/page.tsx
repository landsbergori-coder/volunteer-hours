import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, StatCard, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { Role } from "@prisma/client";
import { Users, Clock, FileSpreadsheet, Trophy } from "lucide-react";
import { currentGradeProgress, isBagrutEligible } from "@/lib/progress";
import { StudentsTable, TeacherRow } from "./StudentsTable";

export default async function TeacherDashboard() {
  const session = await requireRole(Role.TEACHER);
  const teacher = await prisma.teacher.findUnique({
    where: { user_id: session.userId },
  });
  if (!teacher) return null;

  // רק תלמידי הכיתה של המחנך/ת
  const students = await prisma.student.findMany({
    where: { homeroom_teacher_id: teacher.id, user: { archived_at: null } },
    include: {
      hours: { select: { calculated_hours: true, grade_level: true } },
      reflections: { select: { semester: true } },
      placements: {
        where: { is_active: true },
        include: { volunteer_place: true },
      },
    },
    orderBy: { last_name: "asc" },
  });

  const rows: TeacherRow[] = students.map((s) => {
    const total = s.hours.reduce((sum, h) => sum + h.calculated_hours, 0);
    const semesters = new Set(s.reflections.map((r) => r.semester));
    const prog = currentGradeProgress(s.hours, s.grade_level);
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      national_id: s.national_id,
      places: s.placements.map((pl) => ({
        name: pl.volunteer_place.place_name,
        supervisor: pl.volunteer_place.supervisor_name,
        phone: pl.volunteer_place.supervisor_phone,
        email: pl.volunteer_place.supervisor_email,
      })),
      totalHours: total,
      gradeDone: prog.done,
      gradeTarget: prog.target,
      bagrutEligible: isBagrutEligible(s.hours),
      reflA: semesters.has("A"),
      reflB: semesters.has("B"),
    };
  });

  const totalHours = rows.reduce((s, r) => s + r.totalHours, 0);
  const avg = rows.length > 0 ? totalHours / rows.length : 0;
  const eligible = rows.filter((r) => r.bagrutEligible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          שלום, {teacher.full_name}
        </h1>
        <p className="text-sm text-gray-500">כיתה {teacher.class_name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="מספר תלמידים"
          value={rows.length}
          icon={<Users size={22} />}
        />
        <StatCard
          label="סך שעות הכיתה"
          value={`${formatHours(totalHours)} שעות`}
          icon={<Clock size={22} />}
        />
        <StatCard
          label="ממוצע לתלמיד"
          value={`${formatHours(avg)} שעות`}
          icon={<Clock size={22} />}
        />
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <a href="/api/export/reflections?scope=class" className="btn-secondary">
            <FileSpreadsheet size={16} /> ייצוא רפלקציות והערכות (הכיתה)
          </a>
          <a href="/api/export/evaluations" className="btn-secondary">
            <FileSpreadsheet size={16} /> הפק הערכה לתעודה
          </a>
        </div>
      )}

      <Card>
        <SectionTitle
          action={
            <span className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" /> זכאים לבגרות חברתית
              <Badge tone={eligible.length ? "amber" : "gray"}>
                {eligible.length}
              </Badge>
            </span>
          }
        >
          תעודת בגרות חברתית
        </SectionTitle>
        {eligible.length === 0 ? (
          <EmptyState>אין כרגע תלמידים זכאים בכיתה.</EmptyState>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {eligible.map((s) => (
              <li key={s.id}>
                <Badge tone="green">{s.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>תלמידי הכיתה</SectionTitle>
        {rows.length === 0 ? (
          <EmptyState>אין תלמידים רשומים בכיתה זו עדיין.</EmptyState>
        ) : (
          <StudentsTable rows={rows} classAverage={avg} />
        )}
      </Card>
    </div>
  );
}

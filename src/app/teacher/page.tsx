import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, StatCard, SectionTitle, EmptyState } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { Role } from "@prisma/client";
import { Users, Clock, FileSpreadsheet } from "lucide-react";
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
    const place = s.placements[0]?.volunteer_place ?? null;
    const prog = currentGradeProgress(s.hours, s.grade_level);
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      national_id: s.national_id,
      place: place?.place_name ?? null,
      supervisor: place?.supervisor_name ?? null,
      supervisorPhone: place?.supervisor_phone ?? null,
      supervisorEmail: place?.supervisor_email ?? null,
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

      <Card>
        <SectionTitle
          action={
            rows.length > 0 ? (
              <a
                href="/api/export/reflections?scope=class"
                className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                <FileSpreadsheet size={16} /> ייצוא רפלקציות והערכות (הכיתה)
              </a>
            ) : undefined
          }
        >
          תלמידי הכיתה
        </SectionTitle>
        {rows.length === 0 ? (
          <EmptyState>אין תלמידים רשומים בכיתה זו עדיין.</EmptyState>
        ) : (
          <StudentsTable rows={rows} classAverage={avg} />
        )}
      </Card>
    </div>
  );
}

import { prisma } from "@/lib/db";
import { gradeLabel } from "@/lib/validation";
import { compareByLastName } from "@/lib/format";

/** מחזיר מפת student_id -> סך שעות מצטבר (מכל מקומות ההתנדבות). */
export async function getTotalHoursByStudent(): Promise<Map<number, number>> {
  const groups = await prisma.volunteerHours.groupBy({
    by: ["student_id"],
    _sum: { calculated_hours: true },
  });
  const map = new Map<number, number>();
  for (const g of groups) map.set(g.student_id, g._sum.calculated_hours ?? 0);
  return map;
}

/** סך שעות לתלמיד יחיד. */
export async function getStudentTotalHours(studentId: number): Promise<number> {
  const agg = await prisma.volunteerHours.aggregate({
    where: { student_id: studentId },
    _sum: { calculated_hours: true },
  });
  return agg._sum.calculated_hours ?? 0;
}

type NamedStudent = { first_name: string; last_name: string };

export type AdminStats = {
  studentCount: number;
  totalHours: number;
  avgHoursPerStudent: number;
  placeCount: number;
  classStats: {
    class_name: string;
    studentCount: number;
    totalHours: number;
    avgHours: number;
  }[];
  placeStats: { place_name: string; studentCount: number }[];
  studentsWithoutHours: ({ id: number; name: string; class_name: string } & NamedStudent)[];
  studentsWithoutReflection: ({
    id: number;
    name: string;
    class_name: string;
    missing: string;
  } & NamedStudent)[];
};

/** מחשב את כל הסטטיסטיקות של מסך המנהל. */
export async function getAdminStats(): Promise<AdminStats> {
  const students = await prisma.student.findMany({
    where: { user: { archived_at: null } },
    include: {
      hours: { select: { calculated_hours: true } },
      reflections: { select: { semester: true } },
      placements: {
        where: { is_active: true },
        include: { volunteer_place: true },
      },
    },
  });

  const placeCount = await prisma.volunteerPlace.count();

  let totalHours = 0;
  const byClass = new Map<
    string,
    { studentCount: number; totalHours: number }
  >();
  const byPlace = new Map<string, Set<number>>();
  const studentsWithoutHours: AdminStats["studentsWithoutHours"] = [];
  const studentsWithoutReflection: AdminStats["studentsWithoutReflection"] = [];

  for (const s of students) {
    const sHours = s.hours.reduce((sum, h) => sum + h.calculated_hours, 0);
    totalHours += sHours;
    const name = `${s.first_name} ${s.last_name}`;

    const c = byClass.get(s.class_name) ?? { studentCount: 0, totalHours: 0 };
    c.studentCount += 1;
    c.totalHours += sHours;
    byClass.set(s.class_name, c);

    // תלמיד/ה שמתנדב/ת בכמה מקומות נספר/ת בכל אחד מהמקומות
    for (const pl of s.placements) {
      const activePlace = pl.volunteer_place.place_name;
      const set = byPlace.get(activePlace) ?? new Set<number>();
      set.add(s.id);
      byPlace.set(activePlace, set);
    }

    if (sHours === 0)
      studentsWithoutHours.push({
        id: s.id,
        name,
        first_name: s.first_name,
        last_name: s.last_name,
        class_name: s.class_name,
      });

    const semesters = new Set(s.reflections.map((r) => r.semester));
    const missing: string[] = [];
    if (!semesters.has("A")) missing.push("מחצית א'");
    if (!semesters.has("B")) missing.push("מחצית ב'");
    if (missing.length > 0)
      studentsWithoutReflection.push({
        id: s.id,
        name,
        first_name: s.first_name,
        last_name: s.last_name,
        class_name: s.class_name,
        missing: missing.join(", "),
      });
  }

  studentsWithoutHours.sort(compareByLastName);
  studentsWithoutReflection.sort(compareByLastName);

  const classStats = [...byClass.entries()]
    .map(([class_name, v]) => ({
      class_name,
      studentCount: v.studentCount,
      totalHours: Math.round(v.totalHours * 100) / 100,
      avgHours:
        v.studentCount > 0
          ? Math.round((v.totalHours / v.studentCount) * 100) / 100
          : 0,
    }))
    .sort((a, b) => a.class_name.localeCompare(b.class_name, "he"));

  const placeStats = [...byPlace.entries()]
    .map(([place_name, set]) => ({ place_name, studentCount: set.size }))
    .sort((a, b) => b.studentCount - a.studentCount);

  return {
    studentCount: students.length,
    totalHours: Math.round(totalHours * 100) / 100,
    avgHoursPerStudent:
      students.length > 0
        ? Math.round((totalHours / students.length) * 100) / 100
        : 0,
    placeCount,
    classStats,
    placeStats,
    studentsWithoutHours,
    studentsWithoutReflection,
  };
}

export { gradeLabel };

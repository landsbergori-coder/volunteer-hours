import { prisma } from "@/lib/db";

/** פרופיל מלא של תלמיד עם כל הקשרים — לכרטיס תלמיד ולדשבורד. */
export async function getStudentProfile(studentId: number) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { email: true } },
      homeroom_teacher: true,
      placements: {
        include: { volunteer_place: true },
        orderBy: [{ is_active: "desc" }, { start_date: "desc" }],
      },
      hours: {
        include: { volunteer_place: true },
        orderBy: { volunteer_date: "desc" },
      },
      reflections: true,
      evaluations: {
        include: { volunteer_place: true, supervisor: { select: { full_name: true } } },
        orderBy: { evaluation_date: "desc" },
      },
    },
  });
}

export type StudentProfile = NonNullable<
  Awaited<ReturnType<typeof getStudentProfile>>
>;

/** המקום הפעיל של תלמיד (או null). */
export function activePlacement(profile: StudentProfile) {
  return profile.placements.find((p) => p.is_active) ?? null;
}

/** סך שעות מצטבר. */
export function sumHours(profile: StudentProfile): number {
  return profile.hours.reduce((s, h) => s + h.calculated_hours, 0);
}

/** סך שעות לפי placement_id. */
export function hoursByPlacement(profile: StudentProfile): Map<number, number> {
  const map = new Map<number, number>();
  for (const h of profile.hours) {
    map.set(h.placement_id, (map.get(h.placement_id) ?? 0) + h.calculated_hours);
  }
  return map;
}

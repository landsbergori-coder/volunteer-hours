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

/** כל מקומות ההתנדבות הפעילים של תלמיד (ייתכנו כמה במקביל). */
export function activePlacements(profile: StudentProfile) {
  return profile.placements.filter((p) => p.is_active);
}

/** מקומות ההתנדבות שהסתיימו. */
export function pastPlacements(profile: StudentProfile) {
  return profile.placements.filter((p) => !p.is_active);
}

/** שמות המקומות הפעילים כמחרוזת אחת מופרדת בפסיקים. */
export function activePlaceNames(profile: StudentProfile): string {
  return activePlacements(profile)
    .map((p) => p.volunteer_place.place_name)
    .join(", ");
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

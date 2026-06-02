import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getStudentProfile,
  activePlacement,
  hoursByPlacement,
} from "@/lib/queries";
import { Card, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { formatDate } from "@/lib/format";
import { Role } from "@prisma/client";
import { PlaceForm } from "./PlaceForm";

export default async function StudentPlacePage() {
  const session = await requireRole(Role.STUDENT);
  const student = await prisma.student.findUnique({
    where: { user_id: session.userId },
  });
  if (!student) return null;
  const profile = (await getStudentProfile(student.id))!;
  const active = activePlacement(profile);
  const byPlacement = hoursByPlacement(profile);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">מקום התנדבות</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>
            {active ? "שינוי מקום התנדבות" : "הגדרת מקום התנדבות"}
          </SectionTitle>
          <PlaceForm
            active={
              active
                ? {
                    place_name: active.volunteer_place.place_name,
                    supervisor_name: active.volunteer_place.supervisor_name,
                    supervisor_phone: active.volunteer_place.supervisor_phone,
                    supervisor_email: active.volunteer_place.supervisor_email,
                  }
                : null
            }
          />
        </Card>

        <Card>
          <SectionTitle>היסטוריית מקומות התנדבות</SectionTitle>
          {profile.placements.length === 0 ? (
            <EmptyState>עדיין אין מקומות התנדבות.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {profile.placements.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {p.volunteer_place.place_name}
                    </span>
                    {p.is_active ? (
                      <Badge tone="green">פעיל</Badge>
                    ) : (
                      <Badge tone="gray">הסתיים</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    אחראי: {p.volunteer_place.supervisor_name} ·{" "}
                    {p.volunteer_place.supervisor_phone}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {formatDate(p.start_date)} —{" "}
                    {p.end_date ? formatDate(p.end_date) : "היום"} ·{" "}
                    <span className="font-semibold text-brand-600">
                      {formatHours(byPlacement.get(p.id) ?? 0)} שעות
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

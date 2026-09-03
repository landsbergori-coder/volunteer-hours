import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getStudentProfile,
  activePlacements,
  pastPlacements,
  hoursByPlacement,
} from "@/lib/queries";
import { Card, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { endPlacementAction } from "@/actions/student";
import { formatHours } from "@/lib/hours";
import { formatDate } from "@/lib/format";
import { Role } from "@prisma/client";
import { PlaceForm } from "./PlaceForm";
import { LogOut } from "lucide-react";

export default async function StudentPlacePage() {
  const session = await requireRole(Role.STUDENT);
  const student = await prisma.student.findUnique({
    where: { user_id: session.userId },
  });
  if (!student) return null;
  const profile = (await getStudentProfile(student.id))!;
  const actives = activePlacements(profile);
  const past = pastPlacements(profile);
  const byPlacement = hoursByPlacement(profile);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">מקומות התנדבות</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>הוספת מקום התנדבות</SectionTitle>
          <PlaceForm hasActive={actives.length > 0} />
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle
              action={
                actives.length > 0 ? (
                  <Badge tone="green">{actives.length} פעילים</Badge>
                ) : undefined
              }
            >
              מקומות התנדבות פעילים
            </SectionTitle>
            {actives.length === 0 ? (
              <EmptyState>
                עדיין לא הגדרת מקום התנדבות. יש להוסיף מקום כדי לדווח שעות.
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {actives.map((p) => (
                  <li key={p.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {p.volunteer_place.place_name}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          אחראי: {p.volunteer_place.supervisor_name} ·{" "}
                          {p.volunteer_place.supervisor_phone}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          מתאריך {formatDate(p.start_date)} ·{" "}
                          <span className="font-semibold text-brand-600">
                            {formatHours(byPlacement.get(p.id) ?? 0)} שעות
                          </span>
                        </div>
                      </div>
                      <ConfirmButton
                        action={endPlacementAction}
                        hidden={{ placement_id: String(p.id) }}
                        className="btn-secondary shrink-0 text-sm"
                        title="סיום התנדבות"
                        message={`לסיים את ההתנדבות ב"${p.volunteer_place.place_name}"?\nהמקום יעבור להיסטוריה, השעות שדיווחת יישמרו, ושאר מקומות ההתנדבות שלך יישארו פעילים.`}
                        confirmLabel="סיום התנדבות"
                      >
                        <LogOut size={16} /> סיום
                      </ConfirmButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>מקומות שהסתיימו</SectionTitle>
            {past.length === 0 ? (
              <EmptyState>אין מקומות התנדבות שהסתיימו.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {past.map((p) => (
                  <li key={p.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {p.volunteer_place.place_name}
                      </span>
                      <Badge tone="gray">הסתיים</Badge>
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
    </div>
  );
}

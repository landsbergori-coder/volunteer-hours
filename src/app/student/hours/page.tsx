import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getStudentProfile,
  activePlacements,
  sumHours,
} from "@/lib/queries";
import { Card, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatHours } from "@/lib/hours";
import { formatDate } from "@/lib/format";
import { Role } from "@prisma/client";
import { HoursForm } from "./HoursForm";
import { deleteHoursAction } from "@/actions/student";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Trash2 } from "lucide-react";

export default async function StudentHoursPage() {
  const session = await requireRole(Role.STUDENT);
  const student = await prisma.student.findUnique({
    where: { user_id: session.userId },
  });
  if (!student) return null;
  const profile = (await getStudentProfile(student.id))!;
  const actives = activePlacements(profile);
  const total = sumHours(profile);
  const placeOptions = actives.map((p) => ({
    id: p.id,
    name: p.volunteer_place.place_name,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">דיווחי שעות</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle>דיווח שעות חדש</SectionTitle>
          <HoursForm places={placeOptions} />
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <Badge tone="blue">סה&quot;כ {formatHours(total)} שעות</Badge>
            }
          >
            היסטוריית דיווחים ({profile.hours.length})
          </SectionTitle>
          {profile.hours.length === 0 ? (
            <EmptyState>עדיין לא דיווחת שעות.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b">
                    <th className="py-2 font-medium">תאריך</th>
                    <th className="py-2 font-medium">התחלה</th>
                    <th className="py-2 font-medium">סיום</th>
                    <th className="py-2 font-medium">שעות</th>
                    <th className="py-2 font-medium">מקום</th>
                    <th className="py-2 font-medium">תיאור</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {profile.hours.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(h.volunteer_date)}</td>
                      <td className="py-2">{h.start_time}</td>
                      <td className="py-2">{h.end_time}</td>
                      <td className="py-2 font-semibold">
                        {formatHours(h.calculated_hours)}
                      </td>
                      <td className="py-2">{h.volunteer_place.place_name}</td>
                      <td className="py-2 text-gray-500">
                        {h.description || "—"}
                      </td>
                      <td className="py-2">
                        <ConfirmButton
                          action={deleteHoursAction}
                          hidden={{ id: String(h.id) }}
                          className="icon-btn hover:text-red-600"
                          title="מחיקת דיווח"
                          message={`למחוק את הדיווח מתאריך ${formatDate(h.volunteer_date)} (${formatHours(h.calculated_hours)} שעות)?`}
                          confirmLabel="מחיקה"
                        >
                          <Trash2 size={16} />
                        </ConfirmButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

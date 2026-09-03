import {
  StudentProfile,
  activePlacements,
  sumHours,
  hoursByPlacement,
} from "@/lib/queries";
import {
  currentGradeProgress,
  bagrutBreakdown,
  isBagrutEligible,
} from "@/lib/progress";
import { Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { ProgressBar } from "@/components/ProgressBar";
import { BagrutTrophy } from "@/components/BagrutTrophy";
import { formatHours } from "@/lib/hours";
import { formatDate } from "@/lib/format";
import { gradeLabel, semesterLabel, BAGRUT_PER_GRADE } from "@/lib/validation";

/** כרטיס תלמיד מלא — לקריאה בלבד, משותף למחנך ולמנהל. */
export function StudentCard({ profile }: { profile: StudentProfile }) {
  const actives = activePlacements(profile);
  const total = sumHours(profile);
  const byPlacement = hoursByPlacement(profile);
  const reflA = profile.reflections.find((r) => r.semester === "A");
  const reflB = profile.reflections.find((r) => r.semester === "B");
  const progress = currentGradeProgress(profile.hours, profile.grade_level);
  const breakdown = bagrutBreakdown(profile.hours);
  const bagrutEligible = isBagrutEligible(profile.hours);

  return (
    <div className="space-y-6">
      {/* פרטים אישיים */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm text-gray-500">
              ת&quot;ז {profile.national_id} · שכבה{" "}
              {gradeLabel[profile.grade_level]} · כיתה {profile.class_name}
            </p>
            {profile.homeroom_teacher && (
              <p className="text-sm text-gray-500">
                מחנך/ת: {profile.homeroom_teacher.full_name}
              </p>
            )}
            <p className="text-sm text-gray-500">אימייל: {profile.user.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone="blue">סה&quot;כ {formatHours(total)} שעות</Badge>
            {bagrutEligible && <BagrutTrophy />}
          </div>
        </div>
      </Card>

      {/* מד התקדמות + בגרות חברתית */}
      <Card>
        <SectionTitle>מד התקדמות — שכבה {gradeLabel[profile.grade_level]}</SectionTitle>
        <ProgressBar done={progress.done} target={progress.target} />
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-2 text-sm font-medium text-gray-600">
            בגרות חברתית ({BAGRUT_PER_GRADE} שעות בכל שכבה)
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["GRADE_10", "GRADE_11", "GRADE_12"] as const).map((g) => (
              <div key={g}>
                <div className="mb-1 text-xs text-gray-500">שכבה {gradeLabel[g]}</div>
                <ProgressBar done={breakdown[g]} target={BAGRUT_PER_GRADE} compact />
              </div>
            ))}
          </div>
          {profile.bagrut_track && (
            <div className="mt-3">
              <Badge tone="amber">רשום/ה למסלול בגרות חברתית</Badge>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* מקומות פעילים ואחראים */}
        <Card>
          <SectionTitle
            action={
              actives.length > 1 ? (
                <Badge tone="green">{actives.length} מקומות</Badge>
              ) : undefined
            }
          >
            מקומות התנדבות פעילים
          </SectionTitle>
          {actives.length === 0 ? (
            <EmptyState>אין מקום התנדבות פעיל.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {actives.map((a) => (
                <li
                  key={a.id}
                  className="space-y-1 rounded-lg border border-gray-100 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold">
                      {a.volunteer_place.place_name}
                    </span>
                    <span className="font-semibold text-brand-600">
                      {formatHours(byPlacement.get(a.id) ?? 0)} ש&apos;
                    </span>
                  </div>
                  <div className="text-gray-600">
                    אחראי: {a.volunteer_place.supervisor_name}
                  </div>
                  <div className="text-gray-600">
                    טלפון: {a.volunteer_place.supervisor_phone}
                  </div>
                  <div className="text-gray-600">
                    אימייל: {a.volunteer_place.supervisor_email}
                  </div>
                  <div className="text-gray-400">
                    מתאריך {formatDate(a.start_date)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* היסטוריית מקומות */}
        <Card>
          <SectionTitle>כל מקומות ההתנדבות</SectionTitle>
          {profile.placements.length === 0 ? (
            <EmptyState>אין מקומות התנדבות.</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {profile.placements.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div>
                    <span className="font-medium">
                      {p.volunteer_place.place_name}
                    </span>
                    <span className="mr-2 text-xs text-gray-400">
                      {formatDate(p.start_date)} —{" "}
                      {p.end_date ? formatDate(p.end_date) : "היום"}
                    </span>
                    <span className="mr-2">
                      {p.is_active ? (
                        <Badge tone="green">פעיל</Badge>
                      ) : (
                        <Badge tone="gray">הסתיים</Badge>
                      )}
                    </span>
                  </div>
                  <span className="font-semibold text-brand-600">
                    {formatHours(byPlacement.get(p.id) ?? 0)} ש&apos;
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* דיווחי שעות */}
      <Card>
        <SectionTitle>דיווחי שעות ({profile.hours.length})</SectionTitle>
        {profile.hours.length === 0 ? (
          <EmptyState>אין דיווחי שעות.</EmptyState>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* רפלקציות */}
        <Card>
          <SectionTitle>רפלקציות</SectionTitle>
          <div className="space-y-4">
            {[
              { key: "A", refl: reflA },
              { key: "B", refl: reflB },
            ].map(({ key, refl }) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{semesterLabel[key]}</span>
                  {refl ? (
                    <Badge tone="green">{formatDate(refl.submitted_at)}</Badge>
                  ) : (
                    <Badge tone="red">טרם הוגשה</Badge>
                  )}
                </div>
                {refl ? (
                  <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {refl.content}
                  </p>
                ) : (
                  <EmptyState>לא הוגשה רפלקציה.</EmptyState>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* הערכות אחראים */}
        <Card>
          <SectionTitle>הערכות אחראי מקום ההתנדבות</SectionTitle>
          {profile.evaluations.length === 0 ? (
            <EmptyState>טרם נכתבו הערכות.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {profile.evaluations.map((ev) => (
                <li key={ev.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {ev.evaluation_text}
                  </p>
                  <div className="mt-2 text-xs text-gray-400">
                    {ev.volunteer_place.place_name} · {ev.supervisor.full_name} ·{" "}
                    {formatDate(ev.evaluation_date)}
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

import Link from "next/link";
import { Clock, MapPin, FileText, Plus, History, Trophy, CalendarClock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getStudentProfile,
  activePlacements,
  activePlaceNames,
  sumHours,
} from "@/lib/queries";
import {
  currentGradeProgress,
  bagrutBreakdown,
  isBagrutEligible,
} from "@/lib/progress";
import { StatCard, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { ProgressBar } from "@/components/ProgressBar";
import { BagrutTrophy } from "@/components/BagrutTrophy";
import { SubmitButton } from "@/components/SubmitButton";
import { registerBagrutAction, resolvePlacementReviewAction } from "@/actions/student";
import { formatHours } from "@/lib/hours";
import { formatDate } from "@/lib/format";
import { gradeLabel, semesterLabel, BAGRUT_PER_GRADE } from "@/lib/validation";
import { Role } from "@prisma/client";

export default async function StudentDashboard() {
  const session = await requireRole(Role.STUDENT);
  const student = await prisma.student.findUnique({
    where: { user_id: session.userId },
  });
  if (!student) return null;
  const profile = (await getStudentProfile(student.id))!;
  const actives = activePlacements(profile);
  const activeNames = activePlaceNames(profile);
  const total = sumHours(profile);
  const recent = profile.hours.slice(0, 5);

  const reflA = profile.reflections.find((r) => r.semester === "A");
  const reflB = profile.reflections.find((r) => r.semester === "B");

  const progress = currentGradeProgress(profile.hours, profile.grade_level);
  const breakdown = bagrutBreakdown(profile.hours);
  const bagrutEligible = isBagrutEligible(profile.hours);
  const isGrade12 = profile.grade_level === "GRADE_12";

  return (
    <div className="space-y-6">
      {/* Hero greeting card */}
      <div className="rounded-2xl bg-brand-800 px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/65 mb-0.5">שלום חזרה,</p>
          <h1 className="text-2xl font-bold leading-snug">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-sm text-white/65 mt-1">
            שכבה {gradeLabel[profile.grade_level]} · כיתה {profile.class_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {bagrutEligible && <BagrutTrophy />}
          <div className="rounded-xl bg-white/12 px-5 py-3 text-center">
            <div className="text-xs text-white/60 mb-0.5">שעות השנה</div>
            <div className="text-3xl font-bold text-white leading-none">{formatHours(total)}</div>
            <div className="text-xs text-white/55 mt-0.5">מתוך {progress.target ?? "∞"}</div>
          </div>
        </div>
      </div>

      {profile.needs_placement_review && (
        <Card className="border-brand-200 bg-brand-50">
          <div className="flex items-start gap-3">
            <CalendarClock size={22} className="mt-0.5 shrink-0 text-brand-600" />
            <div className="w-full text-sm">
              <p className="font-semibold text-brand-800">שנת לימודים חדשה!</p>
              <p className="text-brand-700">
                עברת לשכבה {gradeLabel[profile.grade_level]}.{" "}
                {actives.length > 0
                  ? "באילו ממקומות ההתנדבות שלך את/ה ממשיך/ה השנה?"
                  : "אין לך כרגע מקום התנדבות פעיל — אפשר להוסיף מקום חדש."}
              </p>

              <form action={resolvePlacementReviewAction} className="mt-3 space-y-3">
                {actives.length > 0 && (
                  <>
                    <ul className="space-y-2">
                      {actives.map((p) => (
                        <li key={p.id}>
                          <label className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-brand-100 bg-white px-3 py-2">
                            <input
                              type="checkbox"
                              name="keep_placement_id"
                              value={p.id}
                              defaultChecked
                              className="h-4 w-4 accent-brand-600"
                            />
                            <span className="font-medium text-gray-900">
                              {p.volunteer_place.place_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              אחראי: {p.volunteer_place.supervisor_name}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-brand-700">
                      מקום שלא יסומן יעבור להיסטוריה — השעות שדיווחת בו יישמרו
                      וימשיכו להיספר בסך הכולל.
                    </p>
                  </>
                )}

                <div className="flex flex-wrap gap-2">
                  <SubmitButton className="btn-secondary" pendingText="שומר...">
                    שמירה והמשך
                  </SubmitButton>
                  <SubmitButton
                    className="btn-primary"
                    name="intent"
                    value="edit"
                    pendingText="..."
                  >
                    שמירה והוספת מקום התנדבות
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>
          <span className="flex items-center gap-2">
            מד התקדמות — שכבה {gradeLabel[profile.grade_level]}
            {bagrutEligible && <Trophy size={18} className="text-amber-500" />}
          </span>
        </SectionTitle>
        <ProgressBar done={progress.done} target={progress.target} />
      </Card>

      {(isGrade12 || profile.bagrut_track || bagrutEligible) && (
        <Card>
          <SectionTitle
            action={
              profile.bagrut_track ? (
                <Badge tone="amber">רשום/ה למסלול</Badge>
              ) : undefined
            }
          >
            <span className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" /> בגרות חברתית
            </span>
          </SectionTitle>

          {bagrutEligible ? (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              כל הכבוד! עמדת בדרישת 60 שעות בכל אחת מהשכבות — את/ה זכאי/ת לתעודת
              בגרות חברתית. 🏆
            </div>
          ) : (
            <p className="mb-4 text-sm text-gray-500">
              לזכאות לתעודת בגרות חברתית נדרשות {BAGRUT_PER_GRADE} שעות בכל אחת
              משלוש השכבות:
            </p>
          )}

          <div className="space-y-3">
            {(["GRADE_10", "GRADE_11", "GRADE_12"] as const).map((g) => (
              <div key={g}>
                <div className="mb-1 text-sm font-medium text-gray-600">
                  שכבה {gradeLabel[g]}
                </div>
                <ProgressBar done={breakdown[g]} target={BAGRUT_PER_GRADE} />
              </div>
            ))}
          </div>

          {isGrade12 && !profile.bagrut_track && (
            <form action={registerBagrutAction} className="mt-4">
              <SubmitButton className="btn-primary" pendingText="נרשם...">
                <Trophy size={16} /> הרשמה למסלול בגרות חברתית
              </SubmitButton>
            </form>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="סך שעות התנדבות"
          value={`${formatHours(total)} שעות`}
          icon={<Clock size={20} />}
          iconColor="blue"
        />
        <StatCard
          label={actives.length > 1 ? "מקומות התנדבות פעילים" : "מקום התנדבות פעיל"}
          value={
            actives.length === 0
              ? "לא הוגדר"
              : actives.length === 1
                ? actives[0].volunteer_place.place_name
                : `${actives.length} מקומות`
          }
          icon={<MapPin size={20} />}
          hint={
            actives.length === 0
              ? undefined
              : actives.length === 1
                ? `אחראי: ${actives[0].volunteer_place.supervisor_name}`
                : activeNames
          }
          iconColor="green"
        />
        <StatCard
          label="דיווחי שעות"
          value={profile.hours.length}
          icon={<FileText size={20} />}
          iconColor="amber"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/student/hours" className="btn-primary">
          <Plus size={18} /> דיווח שעות חדש
        </Link>
        <Link href="/student/place" className="btn-secondary">
          <MapPin size={18} />{" "}
          {actives.length > 0 ? "ניהול מקומות התנדבות" : "הגדרת מקום התנדבות"}
        </Link>
        <Link href="/student/reflection" className="btn-secondary">
          <FileText size={18} /> רפלקציות
        </Link>
      </div>

      {actives.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            עדיין לא הגדרת מקום התנדבות. כדי לדווח שעות, יש להגדיר מקום התנדבות פעיל.{" "}
            <Link href="/student/place" className="font-semibold underline">
              להגדרה
            </Link>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            action={
              <Link href="/student/hours" className="text-sm text-brand-600 hover:underline">
                לכל הדיווחים
              </Link>
            }
          >
            דיווחי שעות אחרונים
          </SectionTitle>
          {recent.length === 0 ? (
            <EmptyState>
              <div className="space-y-3">
                <p>עדיין לא דיווחת שעות התנדבות.</p>
                {actives.length > 0 && (
                  <Link href="/student/hours" className="btn-primary">
                    <Plus size={16} /> דיווח שעות ראשון
                  </Link>
                )}
              </div>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b">
                    <th className="py-2 font-medium">תאריך</th>
                    <th className="py-2 font-medium">שעות</th>
                    <th className="py-2 font-medium">מקום</th>
                    <th className="py-2 font-medium">תיאור</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(h.volunteer_date)}</td>
                      <td className="py-2 font-semibold">
                        {formatHours(h.calculated_hours)}
                      </td>
                      <td className="py-2">{h.volunteer_place.place_name}</td>
                      <td className="py-2 text-gray-500">{h.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>סטטוס רפלקציות</SectionTitle>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span>{semesterLabel.A}</span>
              {reflA ? (
                <Badge tone="green">הוגשה · {formatDate(reflA.submitted_at)}</Badge>
              ) : (
                <Badge tone="red">טרם הוגשה</Badge>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span>{semesterLabel.B}</span>
              {reflB ? (
                <Badge tone="green">הוגשה · {formatDate(reflB.submitted_at)}</Badge>
              ) : (
                <Badge tone="red">טרם הוגשה</Badge>
              )}
            </li>
          </ul>
          <Link
            href="/student/reflection"
            className="btn-secondary mt-4 w-full"
          >
            <FileText size={16} /> לכתיבת רפלקציה
          </Link>
        </Card>
      </div>

      {profile.placements.length > 0 && (
        <Card>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <History size={18} /> מקומות ההתנדבות שלי
            </span>
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-2 font-medium">מקום</th>
                  <th className="py-2 font-medium">אחראי</th>
                  <th className="py-2 font-medium">מתאריך</th>
                  <th className="py-2 font-medium">עד תאריך</th>
                  <th className="py-2 font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {profile.placements.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.volunteer_place.place_name}</td>
                    <td className="py-2">{p.volunteer_place.supervisor_name}</td>
                    <td className="py-2">{formatDate(p.start_date)}</td>
                    <td className="py-2">
                      {p.end_date ? formatDate(p.end_date) : "—"}
                    </td>
                    <td className="py-2">
                      {p.is_active ? (
                        <Badge tone="green">פעיל</Badge>
                      ) : (
                        <Badge tone="gray">הסתיים</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

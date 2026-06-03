import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { gradeLabel } from "@/lib/validation";
import {
  deleteGradeAction,
  deleteAllDataAction,
  archiveGradeAction,
  archiveAllDataAction,
} from "@/actions/admin";
import { ConfirmDeleteForm } from "./ConfirmDeleteForm";
import { ArchiveButton } from "./ArchiveButton";
import { YearAdvanceButton } from "./YearAdvanceButton";
import { Role } from "@prisma/client";
import { AlertTriangle, Archive, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
  await requireRole(Role.ADMIN);

  const [g10, g11, g12, totalStudents, totalHours, archivedCount] =
    await Promise.all([
      prisma.student.count({
        where: { grade_level: "GRADE_10", user: { archived_at: null } },
      }),
      prisma.student.count({
        where: { grade_level: "GRADE_11", user: { archived_at: null } },
      }),
      prisma.student.count({
        where: { grade_level: "GRADE_12", user: { archived_at: null } },
      }),
      prisma.student.count({ where: { user: { archived_at: null } } }),
      prisma.volunteerHours.count(),
      prisma.user.count({
        where: { archived_at: { not: null }, role: { not: "ADMIN" } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ניהול נתונים</h1>
        <p className="text-sm text-gray-500">
          מחיקת נתונים היא בלתי-הפיכה. מומלץ לייצא גיבוי (CSV/Excel) לפני מחיקה.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3 text-sm text-amber-800">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">אזור מסוכן</p>
            <p>
              למחיקת תלמיד בודד — פתח/י את כרטיס התלמיד. למחיקת מחנך/אחראי — מסך
              ניהול חשבונות. כאן מתבצעות פעולות רחבות. <strong>ארכיון</strong>{" "}
              שומר את הנתונים וניתן לשחזר; <strong>מחיקה</strong> בלתי-הפיכה.
            </p>
          </div>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Archive size={18} className="text-gray-500" />
          <span>
            פריטים בארכיון: <strong>{archivedCount}</strong>
          </span>
        </div>
        <Link href="/admin/archive" className="btn-secondary">
          <Archive size={16} /> פתיחת הארכיון (שחזור / מחיקה)
        </Link>
      </Card>

      <Card>
        <SectionTitle>
          <span className="flex items-center gap-2">
            <CalendarClock size={18} /> העברת שנה
          </span>
        </SectionTitle>
        <p className="mb-1 text-sm text-gray-500">
          מעביר את כל התלמידים שנה קדימה. השעות שכל תלמיד צבר נשמרות במלואן
          ומשויכות לשכבה שבה בוצעו.
        </p>
        <ul className="mb-4 mr-4 list-disc text-sm text-gray-600">
          <li>שכבה {gradeLabel.GRADE_10} → {gradeLabel.GRADE_11} ({g10} תלמידים)</li>
          <li>שכבה {gradeLabel.GRADE_11} → {gradeLabel.GRADE_12} ({g11} תלמידים)</li>
          <li>שכבה {gradeLabel.GRADE_12} → ארכיון ({g12} תלמידים)</li>
        </ul>
        <p className="mb-4 text-xs text-gray-400">
          לאחר ההעברה, בכניסה הבאה כל תלמיד יתבקש לאשר או לעדכן את מקום ההתנדבות שלו.
        </p>
        <div className="max-w-md">
          <YearAdvanceButton />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>
            <span className="flex items-center gap-2">
              מחיקת שכבה שלמה <Badge tone="red">בלתי-הפיך</Badge>
            </span>
          </SectionTitle>
          <p className="mb-4 text-sm text-gray-500">
            מוחק את כל התלמידים בשכבה ואת כל הנתונים שלהם (שעות, רפלקציות,
            שיוכים, הערכות). מחנכים ומקומות התנדבות נשמרים.
          </p>

          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 font-medium">
                שכבה {gradeLabel.GRADE_10}{" "}
                <span className="text-sm text-gray-400">({g10} תלמידים)</span>
              </div>
              <div className="mb-3">
                <ArchiveButton
                  action={archiveGradeAction}
                  hidden={{ grade: "GRADE_10" }}
                  label={`העברת שכבה ${gradeLabel.GRADE_10} לארכיון`}
                  confirmMessage={`להעביר את כל שכבה ${gradeLabel.GRADE_10} לארכיון? ניתן לשחזר בהמשך.`}
                />
              </div>
              <ConfirmDeleteForm
                action={deleteGradeAction}
                expected={gradeLabel.GRADE_10}
                hidden={{ grade: "GRADE_10" }}
                buttonLabel={`מחיקת כל שכבה ${gradeLabel.GRADE_10} לצמיתות`}
              />
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 font-medium">
                שכבה {gradeLabel.GRADE_11}{" "}
                <span className="text-sm text-gray-400">({g11} תלמידים)</span>
              </div>
              <div className="mb-3">
                <ArchiveButton
                  action={archiveGradeAction}
                  hidden={{ grade: "GRADE_11" }}
                  label={`העברת שכבה ${gradeLabel.GRADE_11} לארכיון`}
                  confirmMessage={`להעביר את כל שכבה ${gradeLabel.GRADE_11} לארכיון? ניתן לשחזר בהמשך.`}
                />
              </div>
              <ConfirmDeleteForm
                action={deleteGradeAction}
                expected={gradeLabel.GRADE_11}
                hidden={{ grade: "GRADE_11" }}
                buttonLabel={`מחיקת כל שכבה ${gradeLabel.GRADE_11} לצמיתות`}
              />
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 font-medium">
                שכבה {gradeLabel.GRADE_12}{" "}
                <span className="text-sm text-gray-400">({g12} תלמידים)</span>
              </div>
              <div className="mb-3">
                <ArchiveButton
                  action={archiveGradeAction}
                  hidden={{ grade: "GRADE_12" }}
                  label={`העברת שכבה ${gradeLabel.GRADE_12} לארכיון`}
                  confirmMessage={`להעביר את כל שכבה ${gradeLabel.GRADE_12} לארכיון? ניתן לשחזר בהמשך.`}
                />
              </div>
              <ConfirmDeleteForm
                action={deleteGradeAction}
                expected={gradeLabel.GRADE_12}
                hidden={{ grade: "GRADE_12" }}
                buttonLabel={`מחיקת כל שכבה ${gradeLabel.GRADE_12} לצמיתות`}
              />
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>
            <span className="flex items-center gap-2">
              מחיקת כל הנתונים <Badge tone="red">בלתי-הפיך</Badge>
            </span>
          </SectionTitle>
          <p className="mb-4 text-sm text-gray-500">
            מוחק את <strong>כל</strong> התלמידים, המחנכים, האחראים, מקומות
            ההתנדבות וכל הפעילות במערכת. חשבונות המנהלים יישמרו כדי שתוכל/י
            להמשיך. נכון לעכשיו: {totalStudents} תלמידים, {totalHours} דיווחי
            שעות.
          </p>
          <div className="mb-3">
            <ArchiveButton
              action={archiveAllDataAction}
              label="העברת כל הנתונים לארכיון"
              confirmMessage="להעביר את כל הנתונים (תלמידים, מחנכים, אחראים) לארכיון? ניתן לשחזר בהמשך."
            />
          </div>
          <ConfirmDeleteForm
            action={deleteAllDataAction}
            expected="מחק הכל"
            buttonLabel="מחיקת כל הנתונים לצמיתות"
          />
        </Card>
      </div>
    </div>
  );
}

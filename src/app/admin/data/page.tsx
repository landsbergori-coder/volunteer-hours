import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { gradeLabel } from "@/lib/validation";
import { deleteGradeAction, deleteAllDataAction } from "@/actions/admin";
import { ConfirmDeleteForm } from "./ConfirmDeleteForm";
import { Role } from "@prisma/client";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DataManagementPage() {
  await requireRole(Role.ADMIN);

  const [g10, g11, totalStudents, totalHours] = await Promise.all([
    prisma.student.count({ where: { grade_level: "GRADE_10" } }),
    prisma.student.count({ where: { grade_level: "GRADE_11" } }),
    prisma.student.count(),
    prisma.volunteerHours.count(),
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
              ניהול חשבונות. כאן מתבצעות מחיקות רחבות בלבד.
            </p>
          </div>
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
              <ConfirmDeleteForm
                action={deleteGradeAction}
                expected={gradeLabel.GRADE_10}
                hidden={{ grade: "GRADE_10" }}
                buttonLabel={`מחיקת כל שכבה ${gradeLabel.GRADE_10}`}
              />
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 font-medium">
                שכבה {gradeLabel.GRADE_11}{" "}
                <span className="text-sm text-gray-400">({g11} תלמידים)</span>
              </div>
              <ConfirmDeleteForm
                action={deleteGradeAction}
                expected={gradeLabel.GRADE_11}
                hidden={{ grade: "GRADE_11" }}
                buttonLabel={`מחיקת כל שכבה ${gradeLabel.GRADE_11}`}
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
          <ConfirmDeleteForm
            action={deleteAllDataAction}
            expected="מחק הכל"
            buttonLabel="מחיקת כל הנתונים"
          />
        </Card>
      </div>
    </div>
  );
}

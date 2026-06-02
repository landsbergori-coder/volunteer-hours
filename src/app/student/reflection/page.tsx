import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { semesterLabel } from "@/lib/validation";
import { Role } from "@prisma/client";
import { ReflectionForm } from "./ReflectionForm";

export default async function ReflectionPage() {
  const session = await requireRole(Role.STUDENT);
  const student = await prisma.student.findUnique({
    where: { user_id: session.userId },
    include: { reflections: true },
  });
  if (!student) return null;

  const reflA = student.reflections.find((r) => r.semester === "A");
  const reflB = student.reflections.find((r) => r.semester === "B");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">רפלקציות אישיות</h1>
      <p className="text-sm text-gray-500">
        ניתן לכתוב רפלקציה אחת לכל מחצית. הרפלקציה תוצג למחנך/ת ולמנהל המערכת.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>כתיבת / עריכת רפלקציה</SectionTitle>
          <ReflectionForm
            existing={{ A: reflA?.content, B: reflB?.content }}
          />
        </Card>

        <div className="space-y-6">
          {[
            { key: "A", refl: reflA },
            { key: "B", refl: reflB },
          ].map(({ key, refl }) => (
            <Card key={key}>
              <SectionTitle
                action={
                  refl ? (
                    <Badge tone="green">
                      הוגשה · {formatDate(refl.submitted_at)}
                    </Badge>
                  ) : (
                    <Badge tone="red">טרם הוגשה</Badge>
                  )
                }
              >
                {semesterLabel[key]}
              </SectionTitle>
              {refl ? (
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {refl.content}
                </p>
              ) : (
                <EmptyState>עדיין לא נכתבה רפלקציה למחצית זו.</EmptyState>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

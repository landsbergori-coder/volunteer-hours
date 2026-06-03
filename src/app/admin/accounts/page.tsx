import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { roleLabel } from "@/lib/validation";
import { Role } from "@prisma/client";
import { CreateUserForm } from "./CreateUserForm";
import { DeleteStaffButton } from "./DeleteStaffButton";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await requireRole(Role.ADMIN);
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.TEACHER, Role.SUPERVISOR] } },
    include: { teacher: { include: { _count: { select: { students: true } } } } },
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ניהול חשבונות</h1>
      <p className="text-sm text-gray-500">
        יצירת חשבונות למחנכים ולאחראי מקומות התנדבות. אחראי מקום התנדבות ישויך
        אוטומטית לתלמידים כאשר אלה יזינו את כתובת האימייל שלו בפרטי מקום ההתנדבות.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle>יצירת חשבון חדש</SectionTitle>
          <CreateUserForm />
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>חשבונות קיימים ({users.length})</SectionTitle>
          {users.length === 0 ? (
            <EmptyState>עדיין לא נוצרו חשבונות.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b">
                    <th className="py-2 font-medium">שם</th>
                    <th className="py-2 font-medium">תפקיד</th>
                    <th className="py-2 font-medium">אימייל</th>
                    <th className="py-2 font-medium">כיתה</th>
                    <th className="py-2 text-left font-medium">מחיקה</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{u.full_name}</td>
                      <td className="py-2">
                        <Badge tone={u.role === Role.TEACHER ? "blue" : "amber"}>
                          {roleLabel[u.role]}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-500">{u.email}</td>
                      <td className="py-2">{u.teacher?.class_name ?? "—"}</td>
                      <td className="py-2">
                        <div className="flex justify-end">
                          <DeleteStaffButton
                            userId={u.id}
                            name={u.full_name}
                            studentCount={u.teacher?._count.students}
                          />
                        </div>
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

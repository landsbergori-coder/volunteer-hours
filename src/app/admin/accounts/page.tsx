import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle } from "@/components/ui";
import { Role } from "@prisma/client";
import { CreateUserForm } from "./CreateUserForm";
import { AccountsTable, AccountRow } from "./AccountsTable";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await requireRole(Role.ADMIN);
  const users = await prisma.user.findMany({
    where: {
      role: { in: [Role.TEACHER, Role.SUPERVISOR] },
      archived_at: null,
    },
    include: { teacher: { include: { _count: { select: { students: true } } } } },
    orderBy: [{ role: "asc" }, { full_name: "asc" }],
  });

  const rows: AccountRow[] = users.map((u) => ({
    userId: u.id,
    full_name: u.full_name,
    role: u.role,
    email: u.email,
    teacher: u.teacher
      ? {
          id: u.teacher.id,
          class_name: u.teacher.class_name,
          grade_level: u.teacher.grade_level,
          studentCount: u.teacher._count.students,
        }
      : null,
  }));

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
          <AccountsTable rows={rows} />
        </Card>
      </div>
    </div>
  );
}

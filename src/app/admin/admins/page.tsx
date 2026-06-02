import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Role } from "@prisma/client";
import { CreateAdminForm } from "./CreateAdminForm";
import { AdminRowActions } from "./AdminRowActions";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await requireRole(Role.ADMIN);
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    orderBy: { full_name: "asc" },
    select: {
      id: true,
      full_name: true,
      email: true,
      must_change_password: true,
      created_at: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ניהול מנהלים</h1>
      <p className="text-sm text-gray-500">
        יצירת מנהלי מערכת נוספים, איפוס סיסמאות ומחיקה. כל מנהל חדש מקבל סיסמה
        זמנית ומחליף אותה בכניסה הראשונה. חייב להישאר לפחות מנהל אחד במערכת.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle>יצירת מנהל חדש</SectionTitle>
          <CreateAdminForm />
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>מנהלי המערכת ({admins.length})</SectionTitle>
          {admins.length === 0 ? (
            <EmptyState>אין מנהלים.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b">
                    <th className="py-2 font-medium">שם</th>
                    <th className="py-2 font-medium">אימייל</th>
                    <th className="py-2 font-medium">סטטוס</th>
                    <th className="py-2 font-medium">נוצר</th>
                    <th className="py-2 text-left font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{a.full_name}</td>
                      <td className="py-2 text-gray-500">{a.email}</td>
                      <td className="py-2">
                        {a.must_change_password ? (
                          <Badge tone="amber">ממתין להחלפת סיסמה</Badge>
                        ) : (
                          <Badge tone="green">פעיל</Badge>
                        )}
                      </td>
                      <td className="py-2 text-gray-400">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-2">
                        <AdminRowActions
                          id={a.id}
                          name={a.full_name}
                          isSelf={a.id === session.userId}
                          canDelete={admins.length > 1}
                        />
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

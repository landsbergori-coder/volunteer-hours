import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, SectionTitle, EmptyState, Badge } from "@/components/ui";
import { roleLabel, gradeLabel } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { Role } from "@prisma/client";
import { Archive } from "lucide-react";
import { ArchiveRowActions } from "./ArchiveRowActions";
import { RestoreAllButton } from "./RestoreAllButton";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  await requireRole(Role.ADMIN);

  const users = await prisma.user.findMany({
    where: { archived_at: { not: null }, role: { not: Role.ADMIN } },
    include: {
      student: { select: { grade_level: true, class_name: true } },
      teacher: { select: { class_name: true } },
    },
    orderBy: { archived_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Archive size={24} /> ארכיון
          </h1>
          <p className="text-sm text-gray-500">
            פריטים שהועברו לארכיון אינם מופיעים במערכת ואינם נספרים בסטטיסטיקות,
            אך ניתן לשחזר אותם בכל עת. מחיקה לצמיתות אינה הפיכה.
          </p>
        </div>
        {users.length > 0 && <RestoreAllButton />}
      </div>

      <Card>
        <SectionTitle>פריטים בארכיון ({users.length})</SectionTitle>
        {users.length === 0 ? (
          <EmptyState>הארכיון ריק.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-2 font-medium">שם</th>
                  <th className="py-2 font-medium">סוג</th>
                  <th className="py-2 font-medium">פרטים</th>
                  <th className="py-2 font-medium">הועבר לארכיון</th>
                  <th className="py-2 text-left font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{u.full_name}</td>
                    <td className="py-2">
                      <Badge tone={u.role === Role.STUDENT ? "blue" : "amber"}>
                        {roleLabel[u.role]}
                      </Badge>
                    </td>
                    <td className="py-2 text-gray-500">
                      {u.student
                        ? `שכבה ${gradeLabel[u.student.grade_level]} · כיתה ${u.student.class_name}`
                        : u.teacher
                          ? `כיתה ${u.teacher.class_name}`
                          : "—"}
                    </td>
                    <td className="py-2 text-gray-400">
                      {u.archived_at ? formatDate(u.archived_at) : "—"}
                    </td>
                    <td className="py-2">
                      <ArchiveRowActions userId={u.id} name={u.full_name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { Role } from "@prisma/client";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.TEACHER);
  return (
    <Shell
      name={session.name}
      role={session.role}
      links={[{ href: "/teacher", label: "תלמידי הכיתה" }]}
    >
      {children}
    </Shell>
  );
}

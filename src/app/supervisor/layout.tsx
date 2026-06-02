import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { Role } from "@prisma/client";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.SUPERVISOR);
  return (
    <Shell
      name={session.name}
      role={session.role}
      links={[{ href: "/supervisor", label: "התלמידים שלי" }]}
    >
      {children}
    </Shell>
  );
}

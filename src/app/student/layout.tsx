import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { Role } from "@prisma/client";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.STUDENT);
  return (
    <Shell
      name={session.name}
      role={session.role}
      links={[
        { href: "/student", label: "ראשי" },
        { href: "/student/hours", label: "דיווחי שעות" },
        { href: "/student/place", label: "מקום התנדבות" },
        { href: "/student/reflection", label: "רפלקציות" },
      ]}
    >
      {children}
    </Shell>
  );
}

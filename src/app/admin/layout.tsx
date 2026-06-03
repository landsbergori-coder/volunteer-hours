import { requireRole } from "@/lib/auth";
import { Shell } from "@/components/Shell";
import { Role } from "@prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(Role.ADMIN);
  return (
    <Shell
      name={session.name}
      role={session.role}
      links={[
        { href: "/admin", label: "סקירה כללית" },
        { href: "/admin/accounts", label: "ניהול חשבונות" },
        { href: "/admin/admins", label: "ניהול מנהלים" },
        { href: "/admin/data", label: "ניהול נתונים" },
      ]}
    >
      {children}
    </Shell>
  );
}

import { ReactNode } from "react";
import Link from "next/link";
import { LogOut, HeartHandshake } from "lucide-react";
import { roleLabel } from "@/lib/validation";
import { Role } from "@prisma/client";

export type NavLink = { href: string; label: string };

export function Shell({
  name,
  role,
  links,
  children,
}: {
  name: string;
  role: Role;
  links: NavLink[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartHandshake size={20} />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">מחויבות אישית</div>
              <div className="text-xs text-gray-500">ניהול שעות התנדבות</div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-sm font-semibold leading-tight">{name}</div>
              <div className="text-xs text-gray-500">{roleLabel[role]}</div>
            </div>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                title="התנתקות"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-red-600"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>

        {links.length > 0 && (
          <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

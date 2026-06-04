import { ReactNode } from "react";
import { LogOut, HeartHandshake } from "lucide-react";
import { roleLabel } from "@/lib/validation";
import { Role } from "@prisma/client";
import { NavLinks, NavLinksMobile, type NavLink } from "@/components/NavLinks";
import { FlashToast } from "@/components/FlashToast";

export type { NavLink };

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
      <FlashToast />
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white shadow-sm">
              <HeartHandshake size={19} />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight text-gray-900">מעורבות חברתית</div>
              <div className="text-xs text-gray-400">ניהול שעות התנדבות</div>
            </div>
          </div>

          <NavLinks links={links} />

          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-sm font-semibold leading-tight">{name}</div>
              <div className="text-xs text-gray-500">{roleLabel[role]}</div>
            </div>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                aria-label="התנתקות"
                title="התנתקות"
                className="icon-btn hover:text-red-600"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>

        <NavLinksMobile links={links} />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

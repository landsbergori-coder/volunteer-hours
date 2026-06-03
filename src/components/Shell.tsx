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

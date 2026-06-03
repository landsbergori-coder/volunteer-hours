"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export type NavLink = { href: string; label: string };

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (pathname === href) return true;
    // קישור-שורש (כמו /admin) פעיל רק בהתאמה מדויקת; קישור עומק פעיל גם בתת-נתיב
    const isRoot = href.split("/").length <= 2;
    return !isRoot && pathname.startsWith(href + "/");
  };
}

/** קישורי ניווט עם הדגשת הלשונית הפעילה (דסקטופ). */
export function NavLinks({ links }: { links: NavLink[] }) {
  const isActive = useIsActive();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={clsx(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(l.href)
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** קישורי ניווט למובייל (גלילה אופקית). */
export function NavLinksMobile({ links }: { links: NavLink[] }) {
  const isActive = useIsActive();
  if (links.length === 0) return null;
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={clsx(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            isActive(l.href)
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

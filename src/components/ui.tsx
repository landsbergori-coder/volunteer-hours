import { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("card", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {hint && <div className="text-xs text-gray-400">{hint}</div>}
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-gray-900">{children}</h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "red" | "blue" | "amber";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return <span className={clsx("badge", tones[tone])}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

export function Alert({
  ok,
  children,
}: {
  ok?: boolean;
  children: ReactNode;
}) {
  if (!children) return null;
  return (
    <div
      className={clsx(
        "rounded-lg px-4 py-3 text-sm",
        ok
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      )}
    >
      {children}
    </div>
  );
}

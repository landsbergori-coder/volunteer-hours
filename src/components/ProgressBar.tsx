import clsx from "clsx";
import { formatHours } from "@/lib/hours";

/**
 * מד התקדמות שעות. אם target=null — מציג ספירה בלבד ("אין דרישת מינימום").
 */
export function ProgressBar({
  done,
  target,
  compact = false,
}: {
  done: number;
  target: number | null;
  compact?: boolean;
}) {
  if (target == null) {
    return (
      <div className={compact ? "text-xs text-gray-500" : "text-sm text-gray-600"}>
        {formatHours(done)} שעות{!compact && " · אין דרישת מינימום"}
      </div>
    );
  }

  const pct = Math.min(100, Math.round((done / target) * 100));
  const complete = done >= target;
  const barColor = complete
    ? "bg-green-500"
    : pct >= 50
      ? "bg-brand-500"
      : "bg-amber-500";

  const remaining = target - done;

  return (
    <div className={compact ? "w-32" : "w-full"}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className={clsx("font-semibold", complete ? "text-green-700" : "text-gray-700")}>
          {formatHours(done)} / {target} שעות
        </span>
        <span className={clsx("font-medium", complete ? "text-green-600" : "text-gray-400")}>
          {complete ? "✓ הושלם" : `${pct}%`}
        </span>
      </div>
      <div className={clsx("w-full overflow-hidden rounded-full bg-gray-100", compact ? "h-1.5" : "h-2.5")}>
        <div
          className={clsx("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && !complete && remaining > 0 && (
        <div className="mt-1 text-xs text-gray-400">נותרו {remaining} שעות</div>
      )}
    </div>
  );
}

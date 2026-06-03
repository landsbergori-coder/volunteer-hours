import { Trophy } from "lucide-react";

/** אייקון גביע לתלמיד הזכאי לתעודת בגרות חברתית. */
export function BagrutTrophy({
  compact = false,
}: {
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span
        title="זכאי/ת לתעודת בגרות חברתית"
        className="inline-flex items-center text-amber-500"
      >
        <Trophy size={16} />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
      <Trophy size={16} className="text-amber-500" /> זכאי/ת לבגרות חברתית
    </span>
  );
}

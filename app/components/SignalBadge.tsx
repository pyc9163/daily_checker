import { getSignalBadge } from "@/lib/utils";
import { SignalLevel } from "@/lib/types";

export function SignalBadge({ level }: { level: SignalLevel }) {
  const meta = getSignalBadge(level);

  return (
    <span
      className={`signal-ring inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

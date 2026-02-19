import { cn } from "@/lib/utils";
import { STAGE, VERSION_SHORT } from "@/lib/version";

interface VersionBadgeProps {
  className?: string;
}

const STAGE_STYLES: Record<string, string> = {
  alpha: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  beta:  "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  rc:    "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  "":    "bg-primary/10 text-primary border-primary/25",
};

export function VersionBadge({ className }: VersionBadgeProps) {
  const stageStyle = STAGE_STYLES[STAGE] ?? STAGE_STYLES[""];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none select-none",
        stageStyle,
        className
      )}
    >
      {VERSION_SHORT}
      {STAGE && (
        <span className="opacity-75 font-sans normal-case tracking-wide">
          {STAGE}
        </span>
      )}
    </span>
  );
}

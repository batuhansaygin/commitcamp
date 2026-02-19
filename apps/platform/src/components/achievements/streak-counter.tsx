import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface StreakCounterProps {
  streak: number;
  longestStreak?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getNextMilestone(streak: number): number | null {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  return milestones.find((m) => m > streak) ?? null;
}

export function StreakCounter({
  streak,
  longestStreak,
  size = "md",
  className,
}: StreakCounterProps) {
  if (streak === 0) return null;

  const next = getNextMilestone(streak);
  const isHot = streak >= 7;
  const isOnFire = streak >= 30;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5",
        isOnFire
          ? "border-orange-400/50 bg-orange-50/60 dark:bg-orange-950/30"
          : isHot
          ? "border-red-400/50 bg-red-50/60 dark:bg-red-950/30"
          : "border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/30",
        className
      )}
    >
      <Flame
        className={cn(
          "shrink-0",
          size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
          isOnFire
            ? "text-orange-500"
            : isHot
            ? "text-red-500"
            : "text-amber-500"
        )}
      />
      <div>
        <span
          className={cn(
            "font-bold tabular-nums",
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm",
            isOnFire
              ? "text-orange-600 dark:text-orange-400"
              : isHot
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          {streak}
        </span>
        <span
          className={cn(
            "ml-0.5",
            size === "sm" ? "text-[10px]" : "text-xs",
            "text-muted-foreground"
          )}
        >
          {" "}
          day streak
        </span>
      </div>
      {next !== null && size !== "sm" && (
        <span className="text-[10px] text-muted-foreground/70">
          → {next}d
        </span>
      )}
      {longestStreak !== undefined && longestStreak > streak && size === "lg" && (
        <span className="text-[10px] text-muted-foreground">
          best: {longestStreak}d
        </span>
      )}
    </div>
  );
}

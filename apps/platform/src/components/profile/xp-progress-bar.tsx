import { xpProgress } from "@/lib/xp";
import { cn } from "@/lib/utils";

interface XpProgressBarProps {
  xp: number;
  className?: string;
}

export function XpProgressBar({ xp, className }: XpProgressBarProps) {
  const progress = xpProgress(xp);
  const isLegendary = progress.tier === "legendary";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {progress.currentXP.toLocaleString()} /{" "}
          {progress.requiredXP.toLocaleString()} XP
        </span>
        <span className="font-medium" style={{ color: isLegendary ? "#a855f7" : progress.tierColor }}>
          {xp.toLocaleString()} total XP
        </span>
      </div>

      {/* Progress bar track */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isLegendary && "bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-400"
          )}
          style={
            isLegendary
              ? { width: `${progress.percentage}%` }
              : {
                  width: `${progress.percentage}%`,
                  backgroundColor: progress.tierColor,
                }
          }
        />
      </div>
    </div>
  );
}

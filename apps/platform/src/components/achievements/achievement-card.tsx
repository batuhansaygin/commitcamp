import { cn } from "@/lib/utils";
import { RARITY_CONFIG } from "@/lib/types/achievements";
import { RarityBadge } from "@/components/achievements/rarity-badge";
import { CheckCircle2, Lock } from "lucide-react";
import type { AchievementProgress } from "@/lib/types/achievements";

interface AchievementCardProps {
  progress: AchievementProgress;
  className?: string;
}

export function AchievementCard({ progress: p, className }: AchievementCardProps) {
  const config = RARITY_CONFIG[p.rarity];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200",
        p.is_unlocked
          ? cn(
              config.bgClass,
              config.borderClass,
              "hover:-translate-y-0.5 hover:shadow-md",
              config.glowClass
            )
          : "border-border/50 bg-muted/20 opacity-80 hover:opacity-100",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon bubble */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl",
            p.is_unlocked
              ? cn(config.bgClass, config.borderClass)
              : "border-border/60 bg-muted/50 grayscale"
          )}
        >
          {p.icon}
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1">
          <RarityBadge rarity={p.rarity} />
          {p.xp_reward > 0 && (
            <span
              className={cn(
                "text-[9px] font-bold",
                p.is_unlocked ? config.textClass : "text-muted-foreground"
              )}
            >
              +{p.xp_reward} XP
            </span>
          )}
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <h3
            className={cn(
              "text-sm font-semibold leading-snug",
              p.is_unlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {p.name}
          </h3>
          {p.is_unlocked ? (
            <CheckCircle2
              className={cn("h-3.5 w-3.5 shrink-0", config.textClass)}
            />
          ) : (
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {p.description}
        </p>
      </div>

      {/* Progress bar for locked achievements */}
      {!p.is_unlocked && p.requirement_value > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>
              {Math.min(p.current_value, p.requirement_value)}/{p.requirement_value}
            </span>
            <span>{p.progress_percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                p.rarity === "common"    && "bg-gray-400",
                p.rarity === "uncommon"  && "bg-green-500",
                p.rarity === "rare"      && "bg-blue-500",
                p.rarity === "epic"      && "bg-purple-500",
                p.rarity === "legendary" && "bg-amber-500"
              )}
              style={{ width: `${p.progress_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Unlock date for earned achievements */}
      {p.is_unlocked && p.unlocked_at && (
        <p className={cn("text-[10px]", config.textClass)}>
          Earned{" "}
          {new Date(p.unlocked_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

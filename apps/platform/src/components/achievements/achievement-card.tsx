import { cn } from "@/lib/utils";
import { RARITY_CONFIG } from "@/lib/types/achievements";
import { RarityBadge } from "@/components/achievements/rarity-badge";
import { CheckCircle2, Lock } from "lucide-react";
import type { AchievementProgress } from "@/lib/types/achievements";
import Image from "next/image";

interface AchievementCardProps {
  progress: AchievementProgress;
  className?: string;
}

const PROGRESS_COLOR: Record<string, string> = {
  common:    "bg-slate-400",
  uncommon:  "bg-emerald-500",
  rare:      "bg-sky-500",
  epic:      "bg-purple-500",
  legendary: "bg-amber-500",
};

export function AchievementCard({ progress: p, className }: AchievementCardProps) {
  const config = RARITY_CONFIG[p.rarity];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-all duration-300",
        p.is_unlocked
          ? [
              // Golden border
              "border-yellow-300/80 dark:border-yellow-300/60",
              // Light background: warm white-yellow; Dark: mid amber (not near-black)
              "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100",
              "dark:from-amber-800/60 dark:via-yellow-700/40 dark:to-amber-700/50",
              // Persistent glow — brighter yellow
              "shadow-[0_0_20px_rgba(253,224,71,0.35),0_4px_16px_rgba(234,179,8,0.20)]",
              "dark:shadow-[0_0_24px_rgba(253,224,71,0.45),0_4px_18px_rgba(234,179,8,0.30)]",
              // Hover lift + strong radiant glow
              "hover:-translate-y-1",
              "hover:shadow-[0_0_36px_rgba(253,224,71,0.65),0_8px_30px_rgba(234,179,8,0.40)]",
              "hover:border-yellow-300 dark:hover:border-yellow-200/70",
            ].join(" ")
          : "border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-border",
        className
      )}
    >
      {/* Shimmer sweep on hover — bright yellow sheen */}
      {p.is_unlocked && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-yellow-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}

      {/* Corner sparkle glow */}
      {p.is_unlocked && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-yellow-300/30 blur-xl"
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon bubble */}
        <div
          className={cn(
            "relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border",
            p.is_unlocked
              ? "border-yellow-300/70 bg-gradient-to-br from-yellow-300/30 to-amber-400/20 shadow-[0_0_12px_rgba(253,224,71,0.5)]"
              : "border-border/50 bg-muted/60"
          )}
        >
          {p.icon_url ? (
            <Image
              src={p.icon_url}
              alt={p.name}
              fill
              className={cn("object-cover", !p.is_unlocked && "saturate-0 opacity-60")}
              sizes="48px"
            />
          ) : (
            <span className={cn(
              "flex h-full w-full items-center justify-center text-2xl",
              !p.is_unlocked && "saturate-0 opacity-60",
              p.is_unlocked && "drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]"
            )}>
              {p.icon}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1">
          <RarityBadge rarity={p.rarity} />
          {p.xp_reward > 0 && (
            <span
              className={cn(
                "text-[10px] font-bold",
                p.is_unlocked
                  ? "text-yellow-600 dark:text-yellow-300"
                  : "text-muted-foreground"
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
              p.is_unlocked
                ? "text-yellow-900 dark:text-yellow-100"
                : "text-muted-foreground"
            )}
          >
            {p.name}
          </h3>
          {p.is_unlocked ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-yellow-500 dark:text-yellow-300" />
          ) : (
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/50" />
          )}
        </div>
        <p
          className={cn(
            "text-xs leading-relaxed line-clamp-2",
            p.is_unlocked
              ? "text-yellow-800/80 dark:text-yellow-200/80"
              : "text-muted-foreground"
          )}
        >
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
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                PROGRESS_COLOR[p.rarity] ?? "bg-primary/60"
              )}
              style={{ width: `${p.progress_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Unlock date — golden tint */}
      {p.is_unlocked && p.unlocked_at && (
        <p className="text-[10px] text-yellow-600/90 dark:text-yellow-300/80">
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

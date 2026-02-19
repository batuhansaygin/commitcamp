import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RARITY_CONFIG } from "@/lib/types/achievements";
import { RarityBadge } from "@/components/achievements/rarity-badge";
import type { Achievement } from "@/lib/types/achievements";
import { Lock } from "lucide-react";

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string | null;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    outer: "h-8 w-8",
    emoji: "text-base",
    lock: "h-3 w-3",
    ring: "ring-1",
  },
  md: {
    outer: "h-12 w-12",
    emoji: "text-2xl",
    lock: "h-4 w-4",
    ring: "ring-1",
  },
  lg: {
    outer: "h-16 w-16",
    emoji: "text-3xl",
    lock: "h-5 w-5",
    ring: "ring-2",
  },
};

export function AchievementBadge({
  achievement,
  isUnlocked,
  unlockedAt,
  size = "md",
  showTooltip = true,
  className,
}: AchievementBadgeProps) {
  const config = RARITY_CONFIG[achievement.rarity];
  const sizeConfig = SIZE_CONFIG[size];

  const badge = (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl border transition-all duration-200 cursor-default",
        sizeConfig.outer,
        sizeConfig.ring,
        isUnlocked
          ? cn(config.bgClass, config.borderClass, "hover:scale-110 hover:shadow-sm")
          : "bg-muted/40 border-border/50 opacity-50",
        className
      )}
    >
      <span
        className={cn(sizeConfig.emoji, !isUnlocked && "saturate-0 opacity-70")}
      >
        {achievement.icon}
      </span>
      {!isUnlocked && (
        <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-background border border-border/60 p-0.5">
          <Lock className={cn(sizeConfig.lock, "text-muted-foreground")} />
        </div>
      )}
    </div>
  );

  if (!showTooltip) return badge;

  return (
    // Use a single TooltipProvider per badge with skipDelayDuration so
    // moving between badges feels instant, and high z-index to avoid overlaps
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="z-[200] max-w-[200px] text-center space-y-1.5 p-3 rounded-xl border border-border shadow-lg"
        >
          <p className="font-semibold text-sm">
            {achievement.icon} {achievement.name}
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            {achievement.description}
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <RarityBadge rarity={achievement.rarity} />
            {achievement.xp_reward > 0 && (
              <span className="text-[10px] font-semibold text-primary">
                +{achievement.xp_reward} XP
              </span>
            )}
          </div>
          {isUnlocked && unlockedAt && (
            <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-1.5">
              Earned{" "}
              {new Date(unlockedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { cn } from "@/lib/utils";
import { RARITY_CONFIG } from "@/lib/types/achievements";
import type { AchievementRarity } from "@/lib/types/achievements";

interface RarityBadgeProps {
  rarity: AchievementRarity;
  className?: string;
}

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border",
        config.badgeClass,
        config.borderClass,
        className
      )}
    >
      {config.label}
    </span>
  );
}

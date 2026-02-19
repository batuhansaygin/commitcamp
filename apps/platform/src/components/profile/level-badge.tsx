import { getLevelTier } from "@/lib/xp";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  /** "sm" = compact pill (for post cards), "md" = default, "lg" = large (for profile header) */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  legendary: "Legendary",
};

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  const { tier, color } = getLevelTier(level);
  const isLegendary = tier === "legendary";

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-0.5 gap-1",
    lg: "text-sm px-2.5 py-1 gap-1.5",
  }[size];

  if (isLegendary) {
    return (
      <span
        title={`Level ${level} · ${TIER_LABEL[tier]}`}
        className={cn(
          "inline-flex items-center rounded-full font-semibold leading-none",
          "bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-400 text-white",
          "animate-pulse",
          sizeClasses,
          className
        )}
      >
        <span className="opacity-80">Lvl</span>
        <span>{level}</span>
      </span>
    );
  }

  return (
    <span
      title={`Level ${level} · ${TIER_LABEL[tier]}`}
      className={cn(
        "inline-flex items-center rounded-full font-semibold leading-none border",
        sizeClasses,
        className
      )}
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}18`,
      }}
    >
      <span className="opacity-70">Lvl</span>
      <span>{level}</span>
    </span>
  );
}

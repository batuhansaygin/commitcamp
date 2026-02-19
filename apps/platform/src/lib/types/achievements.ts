export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export type AchievementCategory =
  | "milestone"
  | "streak"
  | "community"
  | "skill"
  | "level"
  | "special"
  | "explorer"
  | "quality";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  sort_order: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  sort_order: number;
  current_value: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  progress_percent: number;
}

export interface AchievementStats {
  total_unlocked: number;
  total_available: number;
  completion_percent: number;
  rarity_breakdown: Record<
    AchievementRarity,
    { unlocked: number; total: number }
  >;
  recent_unlocks: UserAchievement[];
  current_streak: number;
  longest_streak: number;
  rarest_unlocked: Achievement | null;
}

// ── Rarity display config ────────────────────────────────────────────────────

export const RARITY_CONFIG: Record<
  AchievementRarity,
  {
    label: string;
    color: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    badgeClass: string;
    glowClass: string;
  }
> = {
  common: {
    label: "Common",
    color: "#9ca3af",
    textClass: "text-gray-500 dark:text-gray-400",
    bgClass: "bg-gray-50 dark:bg-gray-900/40",
    borderClass: "border-gray-200 dark:border-gray-700",
    badgeClass: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    glowClass: "shadow-gray-300/40 dark:shadow-gray-800/40",
  },
  uncommon: {
    label: "Uncommon",
    color: "#22c55e",
    textClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-50/60 dark:bg-green-950/30",
    borderClass: "border-green-200 dark:border-green-800",
    badgeClass:
      "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    glowClass: "shadow-green-300/40 dark:shadow-green-900/40",
  },
  rare: {
    label: "Rare",
    color: "#3b82f6",
    textClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50/60 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800",
    badgeClass:
      "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    glowClass: "shadow-blue-300/40 dark:shadow-blue-900/40",
  },
  epic: {
    label: "Epic",
    color: "#a855f7",
    textClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50/60 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    badgeClass:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    glowClass: "shadow-purple-300/40 dark:shadow-purple-900/40",
  },
  legendary: {
    label: "Legendary",
    color: "#f59e0b",
    textClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50/60 dark:bg-amber-950/30",
    borderClass: "border-amber-300 dark:border-amber-700",
    badgeClass:
      "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    glowClass: "shadow-amber-300/50 dark:shadow-amber-900/50",
  },
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  milestone: "Milestones",
  streak: "Streaks",
  community: "Community",
  skill: "Skills",
  level: "Levels",
  special: "Special",
  explorer: "Explorer",
  quality: "Quality",
};

export const CATEGORY_ORDER: AchievementCategory[] = [
  "milestone",
  "streak",
  "community",
  "skill",
  "level",
  "explorer",
  "quality",
  "special",
];

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
    color: "#94a3b8",
    textClass: "text-slate-500 dark:text-slate-400",
    bgClass: "bg-slate-500/10",
    borderClass: "border-slate-500/20",
    badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/20",
    glowClass: "shadow-none",
  },
  uncommon: {
    label: "Uncommon",
    color: "#10b981",
    textClass: "text-emerald-500 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/25",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    glowClass: "shadow-emerald-500/10",
  },
  rare: {
    label: "Rare",
    color: "#38bdf8",
    textClass: "text-sky-500 dark:text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/25",
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
    glowClass: "shadow-sky-500/10",
  },
  epic: {
    label: "Epic",
    color: "#a855f7",
    textClass: "text-purple-500 dark:text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/25",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
    glowClass: "shadow-purple-500/15",
  },
  legendary: {
    label: "Legendary",
    color: "#f59e0b",
    textClass: "text-amber-500 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    glowClass: "shadow-amber-500/20",
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

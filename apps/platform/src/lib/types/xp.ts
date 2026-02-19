/** Reasons for earning XP. */
export type XPReason =
  | "post_created"
  | "first_post"
  | "comment_added"
  | "reaction_received"
  | "follower_gained"
  | "challenge_solved"
  | "duel_won"
  | "duel_lost"
  | "contest_participation"
  | "contest_placement"
  | "challenge_created"
  | "daily_challenge"
  | "achievement_unlocked"
  | "hint_penalty";

/** XP transaction row as stored in the database. */
export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: XPReason;
  created_at: string;
}

/** Level tier names. */
export type LevelTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "legendary";

/** Computed XP progress state for display. */
export interface XPProgress {
  currentLevel: number;
  nextLevel: number;
  /** XP earned within the current level bracket. */
  currentXP: number;
  /** Total XP required to complete the current level bracket. */
  requiredXP: number;
  /** Percentage (0–100) through the current level bracket. */
  percentage: number;
  tier: LevelTier;
  tierColor: string;
}

/** A leaderboard entry returned by the RPC functions. */
export interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  xp_points: number;
  /** The period-specific score (XP earned, post count, or like count). */
  period_score: number;
}

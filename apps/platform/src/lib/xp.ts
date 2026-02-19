import type { LevelTier, XPProgress } from "@/lib/types/xp";

/** Calculate the level from total XP. Formula: floor(sqrt(xp / 100)) + 1 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/** Calculate the minimum XP required to reach a given level. */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

/** Return the tier and its display color for a given level. */
export function getLevelTier(level: number): { tier: LevelTier; color: string } {
  if (level <= 5) return { tier: "bronze", color: "#CD7F32" };
  if (level <= 10) return { tier: "silver", color: "#C0C0C0" };
  if (level <= 20) return { tier: "gold", color: "#FFD700" };
  if (level <= 35) return { tier: "platinum", color: "#E5E4E2" };
  if (level <= 50) return { tier: "diamond", color: "#B9F2FF" };
  return { tier: "legendary", color: "legendary" };
}

/**
 * Compute the full XP progress state from a raw XP total.
 * Returns the current/next level, XP within the bracket, and completion percentage.
 */
export function xpProgress(xp: number): XPProgress {
  const currentLevel = calculateLevel(xp);
  const nextLevel = currentLevel + 1;
  const currentLevelXP = xpForLevel(currentLevel);
  const nextLevelXP = xpForLevel(nextLevel);
  const bracket = nextLevelXP - currentLevelXP;
  const earned = xp - currentLevelXP;
  const { tier, color } = getLevelTier(currentLevel);

  return {
    currentLevel,
    nextLevel,
    currentXP: earned,
    requiredXP: bracket,
    percentage: Math.min(100, Math.round((earned / bracket) * 100)),
    tier,
    tierColor: color,
  };
}

import type { ChallengeDifficulty } from "@/lib/types/challenges";

/** XP awarded for various challenge-related actions. */
export const CHALLENGE_XP = {
  /** Base solve XP per difficulty */
  solve: {
    easy: 50,
    medium: 100,
    hard: 200,
    expert: 400,
  } as Record<ChallengeDifficulty, number>,

  /** Bonus for being the first person to solve a challenge */
  firstSolveBonus: 50,

  /** Max speed bonus per difficulty (faster than average → bonus) */
  speedBonusMax: {
    easy: 25,
    medium: 50,
    hard: 100,
    expert: 200,
  } as Record<ChallengeDifficulty, number>,

  /** Bonus for solving today's daily challenge */
  dailyChallenge: 30,

  /** Streak milestone bonuses (key = days in a row) */
  dailyStreak: {
    3: 50,
    7: 150,
    14: 300,
    30: 750,
  } as Record<number, number>,

  /** Awarded to the winner of a duel */
  duelWin: 50,

  /** Consolation XP for the loser of a duel */
  duelLose: 10,

  /** Awarded when a user's challenge is published */
  createChallenge: 75,

  /** Awarded for registering in a contest */
  contestParticipation: 50,

  /** Contest placement XP (key = finishing rank) */
  contestPlacement: {
    1: 500,
    2: 300,
    3: 150,
  } as Record<number, number>,

  /** XP deducted per hint revealed (per difficulty) */
  hintPenalty: {
    easy: 10,
    medium: 20,
    hard: 30,
    expert: 50,
  } as Record<ChallengeDifficulty, number>,
} as const;

/**
 * Calculate the speed bonus for a solve.
 *
 * Formula: maxBonus × max(0, 1 − (solveTime / avgSolveTime))
 * First solver (no average yet) receives the full max bonus.
 */
export function calculateSpeedBonus(
  difficulty: ChallengeDifficulty,
  solveTimeMs: number,
  avgSolveTimeMs: number
): number {
  const maxBonus = CHALLENGE_XP.speedBonusMax[difficulty] ?? 0;
  if (avgSolveTimeMs <= 0) return maxBonus; // first solver gets max
  const ratio = Math.max(0, 1 - solveTimeMs / avgSolveTimeMs);
  return Math.round(maxBonus * ratio);
}

/**
 * Total XP to award for a passing submission.
 * Includes base reward + optional first-solve + speed bonus.
 */
export function calculateSolveXP(
  difficulty: ChallengeDifficulty,
  xpReward: number,
  xpFirstSolveBonus: number,
  xpSpeedBonusMax: number,
  isFirstSolve: boolean,
  solveTimeMs: number,
  avgSolveTimeMs: number
): number {
  const base = xpReward ?? CHALLENGE_XP.solve[difficulty];
  const firstBonus = isFirstSolve ? xpFirstSolveBonus : 0;
  const speedBonus = calculateSpeedBonus(difficulty, solveTimeMs, avgSolveTimeMs);
  const cappedSpeed = Math.min(speedBonus, xpSpeedBonusMax);
  return base + firstBonus + cappedSpeed;
}

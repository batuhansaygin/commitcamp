"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  AchievementStats,
  AchievementRarity,
} from "@/lib/types/achievements";

// ── Streak ────────────────────────────────────────────────────────────────────

/**
 * Update the user's activity streak.
 * Fire-and-forget — call after any user action.
 */
export async function updateStreak(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("update_streak", { p_user_id: userId });
    return (data as number) ?? 0;
  } catch {
    return 0;
  }
}

// ── Achievement check ─────────────────────────────────────────────────────────

/**
 * Check for newly earned achievements and award XP + notifications for each.
 * Returns the list of newly unlocked achievements (for toast display).
 * Non-blocking — silently ignores errors.
 */
export async function checkAndAwardAchievements(
  userId: string
): Promise<Achievement[]> {
  try {
    const supabase = await createClient();

    // Call the SQL function — returns array of newly unlocked achievement IDs
    const { data: newIds } = await supabase.rpc(
      "check_and_award_achievements",
      { p_user_id: userId }
    );

    if (!newIds || (newIds as string[]).length === 0) return [];

    // Fetch full achievement data for newly unlocked ones
    const { data: achievements } = await supabase
      .from("achievements")
      .select("*")
      .in("id", newIds as string[]);

    if (!achievements || achievements.length === 0) return [];

    // Award XP and create notification for each (direct RPC to avoid circular import)
    await Promise.allSettled(
      (achievements as Achievement[]).map(async (a) => {
        if (a.xp_reward > 0) {
          await supabase.rpc("increment_xp", {
            p_user_id: userId,
            p_amount: a.xp_reward,
            p_reason: "post_created", // closest valid reason
          });
        }
        await createNotification({
          user_id: userId,
          actor_id: null,
          type: "achievement" as never,
          message: `Achievement unlocked: ${a.name}`,
        });
      })
    );

    return achievements as Achievement[];
  } catch {
    return [];
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Fetch all achievements the user has unlocked, ordered newest first. */
export async function getUserAchievements(
  userId: string
): Promise<UserAchievement[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    return (data ?? []) as UserAchievement[];
  } catch {
    return [];
  }
}

/** Fetch all achievements with the user's current progress toward each. */
export async function getUserAchievementProgress(
  userId: string
): Promise<AchievementProgress[]> {
  const supabase = await createClient();

  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_user_achievement_progress",
    { p_user_id: userId }
  );

  if (!rpcError && rpcData && (rpcData as unknown[]).length > 0) {
    return rpcData as AchievementProgress[];
  }

  if (rpcError) {
    console.error("[getUserAchievementProgress] RPC error:", rpcError.message);
  }

  // Fallback: build progress from direct queries
  const [
    { data: allAchievements },
    { data: unlocked },
    { data: profile },
    { count: commentsCount },
    { count: snippetsCount },
    { data: userPosts },
  ] = await Promise.all([
    supabase.from("achievements").select("*").order("sort_order"),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select(
        "posts_count, followers_count, following_count, xp_points, level, current_streak, longest_streak, challenges_solved, duel_wins"
      )
      .eq("id", userId)
      .single(),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("snippets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("posts").select("id").eq("user_id", userId),
  ]);

  if (!allAchievements) return [];

  // Count reactions on user's posts
  let reactionsCount = 0;
  const postIds = (userPosts ?? []).map((p) => p.id);
  if (postIds.length > 0) {
    const { count } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("target_type", "post")
      .in("target_id", postIds);
    reactionsCount = count ?? 0;
  }

  const p = profile as {
    posts_count?: number;
    followers_count?: number;
    following_count?: number;
    xp_points?: number;
    level?: number;
    current_streak?: number;
    longest_streak?: number;
    challenges_solved?: number;
    duel_wins?: number;
  } | null;

  const unlockedMap = new Map<string, string>(
    (unlocked ?? []).map((u) => [u.achievement_id, u.unlocked_at])
  );

  const getValue = (reqType: string): number => {
    switch (reqType) {
      case "posts_count":       return p?.posts_count ?? 0;
      case "comments_count":    return commentsCount ?? 0;
      case "snippets_count":    return snippetsCount ?? 0;
      case "followers_count":   return p?.followers_count ?? 0;
      case "following_count":   return p?.following_count ?? 0;
      case "xp_points":         return p?.xp_points ?? 0;
      case "level":             return p?.level ?? 1;
      case "current_streak":    return p?.current_streak ?? 0;
      case "longest_streak":    return p?.longest_streak ?? 0;
      case "reactions_received": return reactionsCount;
      case "challenges_solved": return p?.challenges_solved ?? 0;
      case "duel_wins":         return p?.duel_wins ?? 0;
      default:                  return 0;
    }
  };

  return (allAchievements as Achievement[]).map((a) => {
    const isUnlocked = unlockedMap.has(a.id);
    const unlockedAt = unlockedMap.get(a.id) ?? null;
    const currentValue = Math.min(getValue(a.requirement_type), a.requirement_value);
    const progressPercent =
      a.requirement_value === 0
        ? 100
        : Math.min(100, Math.round((currentValue * 100) / a.requirement_value));

    return {
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      rarity: a.rarity,
      icon: a.icon,
      icon_url: a.icon_url,
      xp_reward: a.xp_reward,
      requirement_type: a.requirement_type,
      requirement_value: a.requirement_value,
      sort_order: a.sort_order,
      current_value: currentValue,
      is_unlocked: isUnlocked,
      unlocked_at: unlockedAt,
      progress_percent: progressPercent,
    } satisfies AchievementProgress;
  });
}

/** Compute aggregate achievement stats for a user. */
export async function getAchievementStats(
  userId: string
): Promise<AchievementStats> {
  const defaultStats: AchievementStats = {
    total_unlocked: 0,
    total_available: 74,
    completion_percent: 0,
    rarity_breakdown: {
      common: { unlocked: 0, total: 0 },
      uncommon: { unlocked: 0, total: 0 },
      rare: { unlocked: 0, total: 0 },
      epic: { unlocked: 0, total: 0 },
      legendary: { unlocked: 0, total: 0 },
    },
    recent_unlocks: [],
    current_streak: 0,
    longest_streak: 0,
    rarest_unlocked: null,
  };

  try {
    const supabase = await createClient();

    const [
      { data: unlocked },
      { data: catalog },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false }),
      supabase.from("achievements").select("id, rarity"),
      supabase
        .from("profiles")
        .select("current_streak, longest_streak")
        .eq("id", userId)
        .single(),
    ]);

    const totalAvailable = catalog?.length ?? 74;
    const totalUnlocked = unlocked?.length ?? 0;

    // Rarity breakdown
    const rarityBreakdown = { ...defaultStats.rarity_breakdown };
    catalog?.forEach((a) => {
      const r = a.rarity as AchievementRarity;
      if (rarityBreakdown[r]) rarityBreakdown[r].total++;
    });
    (unlocked ?? []).forEach((ua) => {
      const r = (ua.achievement as Achievement)?.rarity as AchievementRarity;
      if (r && rarityBreakdown[r]) rarityBreakdown[r].unlocked++;
    });

    // Rarest unlocked
    const RARITY_RANK: Record<AchievementRarity, number> = {
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };
    const rarestUnlocked = (unlocked ?? []).reduce<Achievement | null>(
      (best, ua) => {
        const a = ua.achievement as Achievement;
        if (!a) return best;
        if (!best) return a;
        return RARITY_RANK[a.rarity] > RARITY_RANK[best.rarity] ? a : best;
      },
      null
    );

    return {
      total_unlocked: totalUnlocked,
      total_available: totalAvailable,
      completion_percent:
        totalAvailable > 0
          ? Math.round((totalUnlocked / totalAvailable) * 100)
          : 0,
      rarity_breakdown: rarityBreakdown,
      recent_unlocks: ((unlocked ?? []) as UserAchievement[]).slice(0, 5),
      current_streak: (profile as { current_streak?: number })?.current_streak ?? 0,
      longest_streak: (profile as { longest_streak?: number })?.longest_streak ?? 0,
      rarest_unlocked: rarestUnlocked,
    };
  } catch {
    return defaultStats;
  }
}

/** Fetch the full achievement catalog (public, no auth needed). */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .order("category")
      .order("sort_order");
    return (data ?? []) as Achievement[];
  } catch {
    return [];
  }
}

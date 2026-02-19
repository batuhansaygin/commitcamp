"use server";

import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/types/xp";

export type LeaderboardPeriod = "week" | "month" | "all";
export type LeaderboardCategory = "xp" | "posts" | "likes";

function periodToSince(period: LeaderboardPeriod): string {
  const now = new Date();
  if (period === "week") {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (period === "month") {
    now.setMonth(now.getMonth() - 1);
    return now.toISOString();
  }
  return "1970-01-01T00:00:00.000Z";
}

/**
 * Fetch leaderboard data for the given period and category.
 * Returns up to 50 entries sorted by score descending.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod = "all",
  category: LeaderboardCategory = "xp",
  limit = 50
): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const supabase = await createClient();

  try {
    if (category === "xp" && period === "all") {
      const { data, error } = await supabase.rpc("get_leaderboard_xp", {
        p_limit: limit,
      });
      if (error) return { data: [], error: error.message };
      // All-time XP: period_score mirrors xp_points
      const entries: LeaderboardEntry[] = (data ?? []).map(
        (row: Omit<LeaderboardEntry, "period_score"> & { xp_points: number }) => ({
          ...row,
          period_score: row.xp_points,
        })
      );
      return { data: entries, error: null };
    }

    if (category === "xp") {
      const since = periodToSince(period);
      const { data, error } = await supabase.rpc("get_leaderboard_xp_period", {
        p_since: since,
        p_limit: limit,
      });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as LeaderboardEntry[], error: null };
    }

    if (category === "posts") {
      const since = periodToSince(period);
      const { data, error } = await supabase.rpc("get_leaderboard_posts", {
        p_since: since,
        p_limit: limit,
      });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as LeaderboardEntry[], error: null };
    }

    if (category === "likes") {
      const since = periodToSince(period);
      const { data, error } = await supabase.rpc("get_leaderboard_likes", {
        p_since: since,
        p_limit: limit,
      });
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as LeaderboardEntry[], error: null };
    }

    return { data: [], error: "Invalid category" };
  } catch {
    return { data: [], error: "Failed to fetch leaderboard" };
  }
}

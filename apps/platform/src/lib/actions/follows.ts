"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/actions/xp";
import { createNotification } from "@/lib/actions/notifications";
import { checkAndAwardAchievements, updateStreak } from "@/lib/actions/achievements";

// ── Helpers ──

interface ActionResult {
  error?: string;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Queries ──

/** Check if the current user follows a given user. */
export async function isFollowing(targetUserId: string): Promise<boolean> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

// ── Mutations ──

/** Follow a user. */
export async function followUser(
  targetUserId: string,
  targetUsername: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (user.id === targetUserId) {
      return { error: "You cannot follow yourself." };
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

    if (error) {
      if (error.code === "23505") return {}; // Already following — not an error
      return { error: error.message };
    }

    await awardXP(targetUserId, 15, "follower_gained");
    await createNotification({
      user_id: targetUserId,
      actor_id: user.id,
      type: "follow",
      message: "started following you",
    });

    // Check achievements for both follower and the followed user
    void Promise.allSettled([
      updateStreak(user.id),
      checkAndAwardAchievements(user.id),        // following_count milestone
      checkAndAwardAchievements(targetUserId),   // followers_count milestone
    ]);
  } catch {
    return { error: "You must be signed in to follow users." };
  }

  revalidatePath(`/profile/${targetUsername}`);
  return {};
}

/** Unfollow a user. */
export async function unfollowUser(
  targetUserId: string,
  targetUsername: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    if (error) return { error: error.message };
  } catch {
    return { error: "You must be signed in to unfollow users." };
  }

  revalidatePath(`/profile/${targetUsername}`);
  return {};
}

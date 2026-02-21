"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/actions/xp";
import { createNotification } from "@/lib/actions/notifications";
import { checkAndAwardAchievements } from "@/lib/actions/achievements";

export type ReactionKind = "like" | "fire" | "rocket" | "heart";
export type ReactionTargetType = "post" | "snippet" | "comment";

interface ToggleReactionResult {
  error?: string;
  /** true = reaction was added, false = reaction was removed */
  added?: boolean;
}

/**
 * Toggle a reaction on a post, snippet, or comment.
 * Awards +5 XP to the content author when a post/snippet is liked.
 */
export async function toggleReaction(
  targetType: ReactionTargetType,
  targetId: string,
  kind: ReactionKind = "like",
  revalidatePath_: string
): Promise<ToggleReactionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to react." };

    // Check whether the reaction already exists
    const { data: existing } = await supabase
      .from("reactions")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();

    if (existing) {
      // Remove existing reaction
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);

      if (error) return { error: error.message };
      revalidatePath(revalidatePath_, "layout");
      return { added: false };
    }

    // Add new reaction
    const { error } = await supabase.from("reactions").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      kind,
    });

    if (error) return { error: error.message };

    // Fire-and-forget: XP, notification, achievements for content author.
    // None of these must be able to revert a successfully inserted reaction.
    void Promise.allSettled([
      (async () => {
        if (targetType !== "post" && targetType !== "snippet") return;
        const table = targetType === "post" ? "posts" : "snippets";
        const { data: target } = await supabase
          .from(table)
          .select("user_id, title")
          .eq("id", targetId)
          .single();
        if (!target?.user_id || target.user_id === user.id) return;
        await awardXP(target.user_id, 5, "reaction_received");
        if (targetType === "post") {
          await createNotification({
            user_id: target.user_id,
            actor_id: user.id,
            type: "like",
            post_id: targetId,
            message: "liked your post",
          });
        }
        await checkAndAwardAchievements(target.user_id);
      })(),
    ]);

    revalidatePath(revalidatePath_, "layout");
    return { added: true };
  } catch {
    return { error: "An error occurred." };
  }
}

/** Fetch the reaction count and current user's reaction for a target. */
export async function getReactionState(
  targetType: ReactionTargetType,
  targetId: string
): Promise<{ count: number; userReaction: ReactionKind | null }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: count ?? 0, userReaction: null };
  }

  const { data: userReaction } = await supabase
    .from("reactions")
    .select("kind")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  return {
    count: count ?? 0,
    userReaction: (userReaction as { kind: ReactionKind } | null)?.kind ?? null,
  };
}

export async function getReactionUsers(
  targetType: ReactionTargetType,
  targetId: string
): Promise<
  {
    user_id: string;
    kind: ReactionKind;
    created_at: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select(
      `
      user_id,
      kind,
      created_at,
      profiles:user_id (username, display_name, avatar_url)
    `
    )
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => ({
    user_id: row.user_id,
    kind: row.kind,
    created_at: row.created_at,
    profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
  }));
}

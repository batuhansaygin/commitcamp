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

/**
 * Fetch initial card state (like count + user flags) for a post or snippet.
 * Called from client hooks via server action for reliable cookie-based auth.
 */
export async function getCardState(
  targetType: "post" | "snippet",
  targetId: string
): Promise<{
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}> {
  const supabase = await createClient();

  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase
      .from("reactions")
      .select("user_id")
      .eq("target_type", targetType)
      .eq("target_id", targetId),
    supabase
      .from("comments")
      .select("id")
      .eq("target_type", targetType)
      .eq("target_id", targetId),
  ]);

  const reactionRows = reactions ?? [];
  const likeCount = reactionRows.length;
  const commentCount = comments?.length ?? 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { likeCount, commentCount, isLiked: false, isBookmarked: false };
  }

  const isLiked = reactionRows.some((r) => r.user_id === user.id);

  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  return { likeCount, commentCount, isLiked, isBookmarked: !!bookmark };
}

/**
 * Batch-fetch comment reaction counts and current user's liked state.
 * Single query + auth check -- used by CommentSection.
 */
export async function getCommentReactions(
  commentIds: string[]
): Promise<{
  counts: Record<string, number>;
  likedByMe: Record<string, boolean>;
}> {
  if (commentIds.length === 0) return { counts: {}, likedByMe: {} };

  const supabase = await createClient();

  const { data: reactions } = await supabase
    .from("reactions")
    .select("target_id, user_id")
    .eq("target_type", "comment")
    .in("target_id", commentIds);

  const rows = reactions ?? [];

  const counts: Record<string, number> = {};
  for (const id of commentIds) counts[id] = 0;
  for (const row of rows) {
    counts[row.target_id] = (counts[row.target_id] ?? 0) + 1;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const likedByMe: Record<string, boolean> = {};
  if (user) {
    for (const row of rows) {
      if (row.user_id === user.id) {
        likedByMe[row.target_id] = true;
      }
    }
  }

  return { counts, likedByMe };
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
  const { data: reactions, error } = await supabase
    .from("reactions")
    .select("user_id, kind, created_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) return [];
  const rows = reactions ?? [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      },
    ])
  );

  return rows.map((row) => ({
    user_id: row.user_id,
    kind: row.kind,
    created_at: row.created_at,
    profiles: profileMap.get(row.user_id) ?? null,
  }));
}

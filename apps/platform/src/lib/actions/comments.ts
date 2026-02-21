"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema, updateCommentSchema } from "@/lib/validations/posts";
import type { CommentWithAuthor } from "@/lib/types/posts";
import { awardXP } from "@/lib/actions/xp";
import { createNotification } from "@/lib/actions/notifications";
import { checkAndAwardAchievements, updateStreak } from "@/lib/actions/achievements";

// ── Helpers ──

interface ActionResult {
  error?: string;
  success?: boolean;
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

/** Fetch comments for a target (post or snippet), ordered oldest first. */
export async function getComments(
  targetType: "post" | "snippet",
  targetId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles:user_id ( username, display_name, avatar_url, level )
    `
    )
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });

  if (error) return { data: [] as CommentWithAuthor[], error: error.message };
  return { data: data as CommentWithAuthor[], error: null };
}

// ── Mutations ──

/** Add a comment to a post or snippet (useActionState-compatible signature). */
export async function addComment(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  return addCommentDirect(formData);
}

/**
 * Form action wrapper — returns void for use with form action={...}.
 * Use this for native form submission; the browser POSTs FormData directly.
 */
export async function addCommentFormAction(formData: FormData): Promise<void> {
  await addCommentDirect(formData);
}

/**
 * Add a comment — direct call (no _prevState arg).
 * Returns ActionResult for programmatic invocation.
 */
export async function addCommentDirect(
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const targetType = formData.get("target_type") as "post" | "snippet";
  const targetId = formData.get("target_id") as string;
  const parentIdRaw = formData.get("parent_id");
  const parentId =
    typeof parentIdRaw === "string" && parentIdRaw.trim().length > 0
      ? parentIdRaw
      : null;

  const parsed = createCommentSchema.safeParse({ content });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  let commentId: string | undefined;

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data: newComment, error } = await supabase
      .from("comments")
      .insert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        parent_id: parentId,
        content: parsed.data.content,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    commentId = newComment?.id;

    // Fire-and-forget side-effects
    void Promise.allSettled([
      awardXP(user.id, 10, "comment_added"),
      updateStreak(user.id),
      checkAndAwardAchievements(user.id),
      (async () => {
        const table = targetType === "post" ? "posts" : "snippets";
        const { data: target } = await supabase
          .from(table)
          .select("user_id")
          .eq("id", targetId)
          .single();
        if (target?.user_id && target.user_id !== user.id && targetType === "post") {
          await createNotification({
            user_id: target.user_id,
            actor_id: user.id,
            type: "comment",
            post_id: targetId,
            comment_id: commentId ?? null,
            message: "commented on your post",
          });
        }
      })(),
    ]);
  } catch {
    return { error: "You must be signed in to comment." };
  }

  if (targetType === "post") {
    revalidatePath(`/forum/${targetId}`, "page");
    revalidatePath("/forum", "layout");
    revalidatePath("/feed", "layout");
  } else {
    revalidatePath(`/snippets/${targetId}`, "page");
    revalidatePath("/snippets", "layout");
    revalidatePath("/feed", "layout");
  }

  return { success: true };
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<ActionResult> {
  const parsed = updateCommentSchema.safeParse({ content });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data: existing, error: existingError } = await supabase
      .from("comments")
      .select("id, user_id, target_type, target_id")
      .eq("id", commentId)
      .maybeSingle();

    if (existingError) return { error: existingError.message };
    if (!existing) return { error: "Comment not found." };
    if (existing.user_id !== user.id) return { error: "Forbidden" };

    const { error: updateError } = await supabase
      .from("comments")
      .update({ content: parsed.data.content })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (updateError) return { error: updateError.message };

    if (existing.target_type === "post") {
      revalidatePath(`/forum/${existing.target_id}`, "page");
      revalidatePath("/forum", "layout");
      revalidatePath("/feed", "layout");
    } else {
      revalidatePath(`/snippets/${existing.target_id}`, "page");
      revalidatePath("/snippets", "layout");
      revalidatePath("/feed", "layout");
    }

    return { success: true };
  } catch {
    return { error: "You must be signed in to edit comments." };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data: existing, error: existingError } = await supabase
      .from("comments")
      .select("id, user_id, target_type, target_id")
      .eq("id", commentId)
      .maybeSingle();

    if (existingError) return { error: existingError.message };
    if (!existing) return { error: "Comment not found." };
    if (existing.user_id !== user.id) return { error: "Forbidden" };

    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (deleteError) return { error: deleteError.message };

    if (existing.target_type === "post") {
      revalidatePath(`/forum/${existing.target_id}`, "page");
      revalidatePath("/forum", "layout");
      revalidatePath("/feed", "layout");
    } else {
      revalidatePath(`/snippets/${existing.target_id}`, "page");
      revalidatePath("/snippets", "layout");
      revalidatePath("/feed", "layout");
    }

    return { success: true };
  } catch {
    return { error: "You must be signed in to delete comments." };
  }
}

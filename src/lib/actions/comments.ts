"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCommentSchema } from "@/lib/validations/posts";
import type { CommentWithAuthor } from "@/lib/types/posts";

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
      profiles:user_id ( username, display_name, avatar_url )
    `
    )
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  if (error) return { data: [] as CommentWithAuthor[], error: error.message };
  return { data: data as CommentWithAuthor[], error: null };
}

// ── Mutations ──

/** Add a comment to a post or snippet. */
export async function addComment(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const targetType = formData.get("target_type") as "post" | "snippet";
  const targetId = formData.get("target_id") as string;

  const parsed = createCommentSchema.safeParse({ content });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      content: parsed.data.content,
    });

    if (error) return { error: error.message };

    // Notify the post/snippet author (if not commenting on own content)
    const table = targetType === "post" ? "posts" : "snippets";
    const { data: target } = await supabase
      .from(table)
      .select("user_id")
      .eq("id", targetId)
      .single();
    if (target?.user_id && target.user_id !== user.id) {
      const path = targetType === "post" ? `/forum/${targetId}` : `/snippets/${targetId}`;
      await supabase.from("notifications").insert({
        user_id: target.user_id,
        type: "comment",
        title: "New comment",
        body: parsed.data.content.slice(0, 100),
        link: path,
      });
    }
  } catch {
    return { error: "You must be signed in to comment." };
  }

  // Revalidate the page to show the new comment
  if (targetType === "post") {
    revalidatePath(`/forum/${targetId}`);
  } else {
    revalidatePath(`/snippets/${targetId}`);
  }

  return {};
}

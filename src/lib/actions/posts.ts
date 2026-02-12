"use server";

import { createClient } from "@/lib/supabase/server";
import { createPostSchema } from "@/lib/validations/posts";
import type { PostWithAuthor, PostType } from "@/lib/types/posts";
import { redirect } from "next/navigation";

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

const POST_SELECT = `
  *,
  profiles:user_id ( username, display_name, avatar_url )
`;

/** Fetch posts with optional type filter, ordered newest first. */
export async function getPosts(
  type?: PostType,
  limit = 20,
  offset = 0
) {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) return { data: [] as PostWithAuthor[], error: error.message };
  return { data: data as PostWithAuthor[], error: null };
}

/** Fetch a single post by ID with author info. */
export async function getPostById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as PostWithAuthor, error: null };
}

// ── Mutations ──

/** Create a new post. Redirects to the post page on success. */
export async function createPost(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    type: formData.get("type"),
    tags: formData.get("tags"),
  };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  let postId: string;

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("posts")
      .insert({ ...parsed.data, user_id: user.id })
      .select("id")
      .single();

    if (error) return { error: error.message };
    postId = data.id;
  } catch {
    return { error: "You must be signed in to create a post." };
  }

  const locale = (formData.get("locale") as string) || "en";
  redirect(`/${locale}/forum/${postId}`);
}

/** Update a post the current user owns. Redirects to the post page on success. */
export async function updatePost(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const postId = formData.get("postId") as string;
  const locale = (formData.get("locale") as string) || "en";
  if (!postId) return { error: "Missing post ID." };

  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
    type: formData.get("type"),
    tags: formData.get("tags"),
  };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("posts")
      .update({
        title: parsed.data.title,
        content: parsed.data.content,
        type: parsed.data.type,
        tags: parsed.data.tags,
      })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } catch {
    return { error: "You must be signed in to edit this post." };
  }

  redirect(`/${locale}/forum/${postId}`);
}

/** Delete a post the current user owns. */
export async function deletePost(
  id: string,
  locale: string = "en"
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } catch {
    return { error: "You must be signed in to delete a post." };
  }

  redirect(`/${locale}/forum`);
}

/** Toggle the is_solved status on a question post the user owns. */
export async function toggleSolved(
  id: string,
  isSolved: boolean
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("posts")
      .update({ is_solved: isSolved })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch {
    return { error: "Unauthorized" };
  }
}

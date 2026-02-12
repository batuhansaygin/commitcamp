"use server";

import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor } from "@/lib/types/posts";
import type { SnippetWithAuthor } from "@/lib/types/snippets";

// ── Feed Queries ──

/** Fetch recent posts from users the current user follows. */
export async function getFeedPosts(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] as PostWithAuthor[], error: "Not authenticated" };

  // Get IDs of users we follow
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = following?.map((f) => f.following_id) ?? [];

  if (followedIds.length === 0) {
    return { data: [] as PostWithAuthor[], error: null };
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles:user_id ( username, display_name, avatar_url )
    `
    )
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [] as PostWithAuthor[], error: error.message };
  return { data: data as PostWithAuthor[], error: null };
}

/** Fetch recent public snippets from users the current user follows. */
export async function getFeedSnippets(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [] as SnippetWithAuthor[], error: "Not authenticated" };

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = following?.map((f) => f.following_id) ?? [];

  if (followedIds.length === 0) {
    return { data: [] as SnippetWithAuthor[], error: null };
  }

  const { data, error } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles:user_id ( username, display_name, avatar_url )
    `
    )
    .in("user_id", followedIds)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [] as SnippetWithAuthor[], error: error.message };
  return { data: data as SnippetWithAuthor[], error: null };
}

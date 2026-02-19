"use server";

import { createClient } from "@/lib/supabase/server";
import type { SearchResults, SearchPostResult, SearchUserResult, SearchTagResult } from "@/lib/types/search";

const EMPTY_RESULTS: SearchResults = { users: [], posts: [], tags: [] };

// ── Global search via RPC ─────────────────────────────────────────────────────

export async function globalSearch(
  query: string,
  limit = 5
): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return EMPTY_RESULTS;
  if (trimmed.length > 100) return EMPTY_RESULTS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_all", {
      search_query: trimmed,
      result_limit: limit,
    });

    if (error || !data) return EMPTY_RESULTS;

    return {
      users: (data.users ?? []) as SearchUserResult[],
      posts: (data.posts ?? []) as SearchPostResult[],
      tags:  (data.tags  ?? []) as SearchTagResult[],
    };
  } catch {
    return EMPTY_RESULTS;
  }
}

// ── Paginated post search ─────────────────────────────────────────────────────

export async function searchPosts(
  query: string,
  type?: string,
  tag?: string,
  page = 1,
  limit = 20
): Promise<{
  data: SearchPostResult[];
  total: number;
  error: string | null;
}> {
  const trimmed = query.trim();
  const supabase = await createClient();

  const offset = (page - 1) * limit;

  let q = supabase
    .from("posts")
    .select(
      `id, title, type, tags, created_at,
       profiles:user_id (username, display_name, avatar_url)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (trimmed.length >= 2) {
    q = q.textSearch("fts", trimmed, { type: "websearch" });
  }
  if (type && type !== "all") {
    q = q.eq("type", type);
  }
  if (tag) {
    q = q.contains("tags", [tag]);
  }

  const { data, count, error } = await q;
  if (error) return { data: [], total: 0, error: error.message };

  const posts = (data ?? []).map((p) => {
    const author = p.profiles as unknown as { username: string; display_name: string | null; avatar_url: string | null } | null;
    return {
      id: p.id,
      title: p.title,
      type: p.type as SearchPostResult["type"],
      tags: p.tags ?? [],
      created_at: p.created_at,
      author_username: author?.username ?? "",
      author_display_name: author?.display_name ?? null,
      author_avatar_url: author?.avatar_url ?? null,
    };
  });

  return { data: posts, total: count ?? 0, error: null };
}

// ── Paginated user search ─────────────────────────────────────────────────────

export async function searchUsers(
  query: string,
  page = 1,
  limit = 20
): Promise<{
  data: SearchUserResult[];
  total: number;
  error: string | null;
}> {
  const trimmed = query.trim();
  const supabase = await createClient();

  const offset = (page - 1) * limit;

  let q = supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, level, tech_stack, followers_count",
      { count: "exact" }
    )
    .order("followers_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (trimmed.length >= 2) {
    q = q.or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`);
  }

  const { data, count, error } = await q;
  if (error) return { data: [], total: 0, error: error.message };

  return {
    data: (data ?? []) as SearchUserResult[],
    total: count ?? 0,
    error: null,
  };
}

// ── Trending / popular tags ───────────────────────────────────────────────────

export async function getPopularTags(
  limit = 10
): Promise<SearchTagResult[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_popular_tags", {
      tag_limit: limit,
    });
    if (error || !data) return [];
    return (data as SearchTagResult[]);
  } catch {
    return [];
  }
}

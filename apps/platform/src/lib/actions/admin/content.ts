"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "./audit";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function listPostsAdmin(
  search = "",
  limit = 50,
  offset = 0
) {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("posts")
    .select("id, title, type, is_solved, created_at, user_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: posts, count, error } = await query;
  if (error) throw new Error(error.message);

  const userIds = [...new Set((posts ?? []).map((p) => p.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const data = (posts ?? []).map((p) => ({ ...p, author: profileMap.get(p.user_id) ?? null }));

  return { posts: data, total: count ?? 0 };
}

export async function deletePost(postId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("posts")
    .select("title")
    .eq("id", postId)
    .single();

  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  await logAdminAction("delete_post", "post", postId, { title: post?.title });
  revalidatePath("/admin/content");
}

// ── Snippets ──────────────────────────────────────────────────────────────────

export async function listSnippetsAdmin(
  search = "",
  limit = 50,
  offset = 0
) {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("snippets")
    .select("id, title, language, is_public, created_at, user_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: snippets, count, error } = await query;
  if (error) throw new Error(error.message);

  const userIds = [...new Set((snippets ?? []).map((s) => s.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const data = (snippets ?? []).map((s) => ({ ...s, author: profileMap.get(s.user_id) ?? null }));

  return { snippets: data, total: count ?? 0 };
}

export async function deleteSnippet(snippetId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: snippet } = await admin
    .from("snippets")
    .select("title")
    .eq("id", snippetId)
    .single();

  const { error } = await admin.from("snippets").delete().eq("id", snippetId);
  if (error) throw new Error(error.message);

  await logAdminAction("delete_snippet", "snippet", snippetId, {
    title: snippet?.title,
  });
  revalidatePath("/admin/content");
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function listCommentsAdmin(
  limit = 50,
  offset = 0
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: comments, count, error } = await admin
    .from("comments")
    .select("id, content, created_at, user_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const userIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const data = (comments ?? []).map((c) => ({
    ...c,
    author: profileMap.get(c.user_id) ?? null,
  }));

  return { comments: data, total: count ?? 0 };
}

export async function deleteComment(commentId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);

  await logAdminAction("delete_comment", "comment", commentId);
  revalidatePath("/admin/content");
}

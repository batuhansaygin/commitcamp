"use server";

import { createClient } from "@/lib/supabase/server";
import { createSnippetSchema } from "@/lib/validations/snippets";
import type { SnippetWithAuthor } from "@/lib/types/snippets";
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

// ── Queries (read-only) ──

/** Fetch public snippets with author info, ordered newest first. */
export async function getSnippets(limit = 20, offset = 0) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles:user_id ( username, display_name, avatar_url )
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { data: [] as SnippetWithAuthor[], error: error.message };
  return { data: data as SnippetWithAuthor[], error: null };
}

/** Fetch a single snippet by ID with author info. */
export async function getSnippetById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles:user_id ( username, display_name, avatar_url )
    `
    )
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as SnippetWithAuthor, error: null };
}

// ── Mutations ──

/** Create a new snippet. Redirects to the snippet page on success. */
export async function createSnippet(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    title: formData.get("title"),
    language: formData.get("language"),
    code: formData.get("code"),
    description: formData.get("description"),
    is_public: formData.get("is_public") !== "false",
  };

  const parsed = createSnippetSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  let snippetId: string;

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("snippets")
      .insert({ ...parsed.data, user_id: user.id })
      .select("id")
      .single();

    if (error) return { error: error.message };
    snippetId = data.id;
  } catch {
    return { error: "You must be signed in to create a snippet." };
  }

  // Redirect outside try/catch — Next.js throws a special error for redirect
  redirect(`/snippets/${snippetId}`);
}

/** Delete a snippet the current user owns. */
export async function deleteSnippet(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } catch {
    return { error: "You must be signed in to delete a snippet." };
  }

  redirect("/snippets");
}

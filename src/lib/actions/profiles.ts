"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profiles";
import type { Profile, ProfileWithStats } from "@/lib/types/profiles";

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

/** Fetch a profile by username with follower/following/content counts. */
export async function getProfileByUsername(
  username: string
): Promise<{ data: ProfileWithStats | null; error: string | null }> {
  const supabase = await createClient();

  // Get the profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return { data: null, error: error?.message ?? "Profile not found" };
  }

  // Get counts in parallel
  const [followers, following, snippets, posts] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase
      .from("snippets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_public", true),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

  const profileWithStats: ProfileWithStats = {
    ...(profile as Profile),
    followers_count: followers.count ?? 0,
    following_count: following.count ?? 0,
    snippets_count: snippets.count ?? 0,
    posts_count: posts.count ?? 0,
  };

  return { data: profileWithStats, error: null };
}

/** Fetch the current user's profile for settings. */
export async function getCurrentProfile(): Promise<{
  data: Profile | null;
  error: string | null;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Profile, error: null };
  } catch {
    return { data: null, error: "Not authenticated" };
  }
}

/** Fetch a user's public snippets. */
export async function getUserSnippets(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snippets")
    .select("id, title, language, description, created_at")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

/** Fetch a user's posts. */
export async function getUserPosts(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, type, tags, is_solved, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { data: [], error: error.message };
  return { data, error: null };
}

// ── Mutations ──

/** Update the current user's profile. */
export async function updateProfile(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    username: formData.get("username"),
    display_name: formData.get("display_name"),
    bio: formData.get("bio"),
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("profiles")
      .update(parsed.data)
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        return { error: "This username is already taken." };
      }
      return { error: error.message };
    }
  } catch {
    return { error: "You must be signed in to update your profile." };
  }

  revalidatePath("/settings");
  return { success: true };
}

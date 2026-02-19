"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Fetch profiles by ids (for messaging inbox: map Stream user id → username). */
export async function getProfilesByIds(ids: string[]): Promise<{
  data: Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>;
  error: string | null;
}> {
  if (ids.length === 0) return { data: [], error: null };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>, error: null };
}

/** Ensure a profile row exists for the current user (sync from auth if missing). */
function buildProfileFromUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const emailPart = (user.email ?? "").split("@")[0] || "user";
  const usernameBase = `${emailPart}_${user.id.replace(/-/g, "").slice(0, 8)}`;
  const username = usernameBase.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const display_name =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    emailPart;
  const avatar_url =
    (user.user_metadata?.avatar_url as string) ??
    (user.user_metadata?.picture as string) ??
    null;
  const role =
    user.user_metadata?.is_admin === true
      ? "admin"
      : typeof user.user_metadata?.role === "string"
        ? user.user_metadata.role
        : "user";
  return { id: user.id, username, display_name, avatar_url, role };
}

/** Fetch the current user's profile for settings. Creates one from auth data if missing. */
export async function getCurrentProfile(): Promise<{
  data: Profile | null;
  error: string | null;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // No profile row (e.g. trigger missed or legacy account) — create from auth user
    if (!data) {
      const profileRow = buildProfileFromUser(user);
      const roleValue =
        profileRow.role === "admin"
          ? "admin"
          : profileRow.role === "moderator"
            ? "moderator"
            : "user";

      const { error: insertError } = await supabase.from("profiles").insert({
        id: profileRow.id,
        username: profileRow.username,
        display_name: profileRow.display_name,
        avatar_url: profileRow.avatar_url,
        role: roleValue,
      });

      // Fallback with service-role client for legacy edge-cases
      if (insertError) {
        const admin = createAdminClient();
        await admin.from("profiles").upsert(
          {
            id: profileRow.id,
            username: profileRow.username,
            display_name: profileRow.display_name,
            avatar_url: profileRow.avatar_url,
            role: roleValue,
          },
          { onConflict: "id" }
        );
      }

      const res = await supabase.from("profiles").select("*").eq("id", user.id).single();
      data = res.data as Profile | null;
      error = res.error;
    }

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

/** Update allow private messages (Discord) toggle. */
export async function updateAllowPrivateMessages(
  allow: boolean
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase
      .from("profiles")
      .update({ allow_private_messages: allow })
      .eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Not authenticated" };
  }
}

/** Disconnect Discord and turn off allow private messages. */
export async function disconnectDiscord(): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        discord_user_id: null,
        discord_username: null,
        allow_private_messages: false,
      })
      .eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Not authenticated" };
  }
}

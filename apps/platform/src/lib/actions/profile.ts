"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";
import type { Profile } from "@/lib/types/profiles";
import type { ProfileStats, FollowerEntry } from "@/lib/types/profile-page";

interface ActionResult {
  error?: string;
  success?: boolean;
  url?: string;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch a profile by username. */
export async function getProfileByUsername(
  username: string
): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "Profile not found" };
  }
  return { data: data as Profile, error: null };
}

/** Fetch computed profile stats via RPC. */
export async function getProfileStats(
  username: string
): Promise<{ data: ProfileStats | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profile_stats", {
    p_username: username,
  });

  if (error || !data || data.length === 0) {
    return { data: null, error: error?.message ?? "Stats not found" };
  }

  const row = data[0];
  return {
    data: {
      posts_count: Number(row.posts_count),
      total_likes: Number(row.total_likes),
      followers_count: Number(row.followers_count),
      following_count: Number(row.following_count),
      total_xp: Number(row.total_xp),
      member_since: row.member_since,
    },
    error: null,
  };
}

/** Fetch paginated posts for a user, optionally filtered by type. */
export async function getProfilePosts(
  username: string,
  type?: string,
  page = 1,
  limit = 10
) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) return { data: [], error: "Profile not found" };

  let query = supabase
    .from("posts")
    .select(
      `id, title, content, type, tags, is_solved, created_at,
       profiles:user_id (username, display_name, avatar_url, level)`
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

/** Fetch paginated public snippets for a user. */
export async function getProfileSnippets(
  username: string,
  page = 1,
  limit = 10
) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) return { data: [], error: "Profile not found" };

  const { data, error } = await supabase
    .from("snippets")
    .select("id, title, language, description, created_at")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

/** Check if the current user is following a given user. */
export async function isFollowingUser(targetUserId: string): Promise<boolean> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Fetch paginated followers for a username. */
export async function getFollowers(
  username: string,
  page = 1,
  limit = 20
): Promise<{ data: FollowerEntry[]; error: string | null }> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) return { data: [], error: "Profile not found" };

  const { data, error } = await supabase
    .from("follows")
    .select(
      `profiles:follower_id (id, username, display_name, avatar_url, level, bio)`
    )
    .eq("following_id", profile.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return { data: [], error: error.message };

  const followers = (data ?? [])
    .map((row) => row.profiles as unknown as FollowerEntry | null)
    .filter((p): p is FollowerEntry => p !== null);

  return { data: followers, error: null };
}

/** Fetch paginated following for a username. */
export async function getFollowing(
  username: string,
  page = 1,
  limit = 20
): Promise<{ data: FollowerEntry[]; error: string | null }> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!profile) return { data: [], error: "Profile not found" };

  const { data, error } = await supabase
    .from("follows")
    .select(
      `profiles:following_id (id, username, display_name, avatar_url, level, bio)`
    )
    .eq("follower_id", profile.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return { data: [], error: error.message };

  const following = (data ?? [])
    .map((row) => row.profiles as unknown as FollowerEntry | null)
    .filter((p): p is FollowerEntry => p !== null);

  return { data: following, error: null };
}

/** Check if a username is available (not taken by another user). */
export async function checkUsernameAvailable(
  username: string
): Promise<{ available: boolean; error?: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("username", username)
      .neq("id", user.id);
    return { available: (count ?? 0) === 0 };
  } catch {
    return { available: false, error: "Not authenticated" };
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Update the current user's full profile (all text fields + tech stack). */
export async function updateProfile(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const techStackRaw = formData.get("tech_stack");
  const techStack: string[] = techStackRaw
    ? (JSON.parse(techStackRaw as string) as string[])
    : [];

  const raw = {
    username: formData.get("username") as string,
    display_name: formData.get("display_name") as string | undefined,
    bio: formData.get("bio") as string | undefined,
    location: formData.get("location") as string | undefined,
    website: formData.get("website") as string | undefined,
    github_username: formData.get("github_username") as string | undefined,
    twitter_username: formData.get("twitter_username") as string | undefined,
    tech_stack: techStack,
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

    revalidatePath(`/profile/${parsed.data.username}`);
    revalidatePath("/settings");
  } catch {
    return { error: "You must be signed in to update your profile." };
  }

  return { success: true };
}

/** Update the avatar_url on the profile after a client-side storage upload. */
export async function updateAvatarUrl(url: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: true, url };
  } catch {
    return { error: "Not authenticated" };
  }
}

/** Update the cover_url on the profile after a client-side storage upload. */
export async function updateCoverUrl(url: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { error } = await supabase
      .from("profiles")
      .update({ cover_url: url })
      .eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: true, url };
  } catch {
    return { error: "Not authenticated" };
  }
}

/** Update notification preferences for the current user. */
export async function updateNotificationPreferences(prefs: {
  likes?: boolean;
  comments?: boolean;
  follows?: boolean;
  level_up?: boolean;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data: current } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single();

    const merged = { ...(current?.notification_preferences ?? {}), ...prefs };

    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: merged })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Not authenticated" };
  }
}

/** Change the current user's password via Supabase Auth. */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const { supabase } = await getAuthenticatedUser();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch {
    return { error: "Not authenticated" };
  }
}

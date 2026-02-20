"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  error?: string;
  success?: boolean;
}

/**
 * After a user unlinks a provider on the client-side, call this to wipe
 * the corresponding profile fields (e.g. github_username).
 */
export async function clearProviderProfileFields(
  provider: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const fieldsToClear: Record<string, null> = {};

    if (provider === "github") {
      fieldsToClear.github_username = null;
    }
    // Google and Discord don't have dedicated profile columns for username,
    // so nothing extra to clear for them.

    if (Object.keys(fieldsToClear).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(fieldsToClear)
        .eq("id", user.id);
      if (error) return { error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Not authenticated" };
  }
}

/**
 * After OAuth callback, sync provider-specific data into the profile.
 * Called from the callback route server-side.
 */
export async function syncProviderDataToProfile(userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: identitiesData } = await supabase.auth.getUserIdentities();
    const identities = identitiesData?.identities ?? [];

    const updates: Record<string, string | null> = {};

    // GitHub → github_username
    const githubIdentity = identities.find((i) => i.provider === "github");
    if (githubIdentity) {
      const githubLogin =
        (githubIdentity.identity_data?.user_name as string) ||
        (githubIdentity.identity_data?.preferred_username as string) ||
        (githubIdentity.identity_data?.login as string) ||
        null;
      if (githubLogin) updates.github_username = githubLogin;
    }

    if (Object.keys(updates).length === 0) return;

    // Only set fields that are currently null/empty (don't overwrite user edits)
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_username")
      .eq("id", userId)
      .single();

    const conditionalUpdates: Record<string, string | null> = {};
    if (updates.github_username && !profile?.github_username) {
      conditionalUpdates.github_username = updates.github_username;
    }

    if (Object.keys(conditionalUpdates).length > 0) {
      await supabase
        .from("profiles")
        .update(conditionalUpdates)
        .eq("id", userId);
    }
  } catch {
    // Non-critical — don't break the auth flow
  }
}

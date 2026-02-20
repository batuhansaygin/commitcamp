"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "./audit";

export interface PlatformSetting {
  key: string;
  value: unknown;
  description: string | null;
  category: "auth" | "features" | "content" | "rate_limits" | "maintenance";
  updated_at: string;
}

// Keys that must also be synced to Supabase Management API
const SUPABASE_MANAGED_KEYS: Record<string, string> = {
  oauth_github_enabled:      "external_github_enabled",
  oauth_google_enabled:      "external_google_enabled",
  oauth_discord_enabled:     "external_discord_enabled",
  manual_linking_enabled:    "security_manual_linking_enabled",
  allow_signup:              "disable_signup",   // inverted
};

async function requireSystemAdmin() {
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

  if (profile?.role !== "system_admin") throw new Error("Forbidden");
  return user;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getAllSettings(): Promise<PlatformSetting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key,value,description,category,updated_at")
    .order("category")
    .order("key");
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformSetting[];
}

export async function getSettingsByCategory(
  category: PlatformSetting["category"]
): Promise<PlatformSetting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key,value,description,category,updated_at")
    .eq("category", category)
    .order("key");
  if (error) throw new Error(error.message);
  return (data ?? []) as PlatformSetting[];
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function updateSetting(
  key: string,
  value: unknown
): Promise<void> {
  const user = await requireSystemAdmin();
  const admin = createAdminClient();

  // Fetch old value for audit
  const { data: existing } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .single();

  const { error } = await admin
    .from("platform_settings")
    .update({ value, updated_by: user.id })
    .eq("key", key);
  if (error) throw new Error(error.message);

  await logAdminAction("update_setting", "setting", key, {
    from: existing?.value,
    to: value,
  });

  // Sync to Supabase Management API if needed
  await syncToSupabaseApi(key, value);

  revalidatePath("/admin/settings");
}

async function syncToSupabaseApi(key: string, value: unknown) {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  if (!accessToken || !projectRef) return;

  const apiKey = SUPABASE_MANAGED_KEYS[key];
  if (!apiKey) return;

  // Invert value for disable_signup (our "allow_signup" is the opposite)
  let apiValue: unknown = value;
  if (key === "allow_signup") {
    apiValue = !value;
  }

  try {
    await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ [apiKey]: apiValue }),
    });
  } catch {
    // Non-critical: log to console but don't fail the action
    console.error(`Failed to sync setting "${key}" to Supabase Management API`);
  }
}

// ── Batch update ─────────────────────────────────────────────────────────────

export async function updateSettingsCategory(
  category: PlatformSetting["category"],
  updates: Record<string, unknown>
): Promise<void> {
  await requireSystemAdmin();
  for (const [key, value] of Object.entries(updates)) {
    await updateSetting(key, value);
  }
}

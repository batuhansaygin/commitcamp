"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────────────────

export type EditableRole = "user" | "moderator" | "admin";

/**
 * Flat map of { [capabilityId]: boolean } per role.
 * Stored as a single JSONB object in role_permissions.permissions:
 * {
 *   "user":      { "admin_panel_access": false, ... },
 *   "moderator": { "view_all_content": true, ... },
 *   "admin":     { "delete_users": false, ... },
 * }
 */
export type RolePermissionsMap = Record<EditableRole, Record<string, boolean>>;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function assertSystemAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "system_admin") {
    throw new Error("Only system_admin can modify role permissions");
  }

  return user.id;
}

// ── Actions ────────────────────────────────────────────────────────────────────

export async function getRolePermissions(): Promise<RolePermissionsMap | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("role_permissions")
    .select("permissions")
    .eq("id", 1)
    .single();

  if (error || !data) return null;
  return data.permissions as RolePermissionsMap;
}

export async function saveRolePermissions(
  permissions: RolePermissionsMap
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await assertSystemAdmin();
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("role_permissions")
      .update({ permissions, updated_at: new Date().toISOString(), updated_by: userId })
      .eq("id", 1);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

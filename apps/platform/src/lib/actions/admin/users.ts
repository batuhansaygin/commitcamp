"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "./audit";

export type UserRole = "user" | "moderator" | "admin" | "system_admin";

export interface AdminUserRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_until: string | null;
  xp_points: number;
  level: number;
  posts_count: number;
  followers_count: number;
  created_at: string;
  email?: string;
}

// ── Guards ──────────────────────────────────────────────────────────────────

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
  return { user, role: profile.role as UserRole };
}

async function requireSystemAdmin() {
  const { user, role } = await requireAdmin();
  if (role !== "system_admin") throw new Error("Forbidden: system_admin required");
  return user;
}

// ── List users ───────────────────────────────────────────────────────────────

export async function listUsers(
  search = "",
  roleFilter = "",
  limit = 50,
  offset = 0
): Promise<{ users: AdminUserRow[]; total: number }> {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select("id,username,display_name,avatar_url,role,is_verified,is_banned,ban_reason,banned_until,xp_points,level,posts_count,followers_count,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
  }
  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  // Fetch emails from auth.users via admin API
  const userIds = (data ?? []).map((u) => u.id);
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const au of authUsers?.users ?? []) {
      if (userIds.includes(au.id)) {
        emailMap[au.id] = au.email ?? "";
      }
    }
  }

  const users = (data ?? []).map((u) => ({
    ...u,
    email: emailMap[u.id] ?? "",
  })) as AdminUserRow[];

  return { users, total: count ?? 0 };
}

// ── Change role ───────────────────────────────────────────────────────────────

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<void> {
  const { user, role: callerRole } = await requireAdmin();

  // Only system_admin can promote to admin/system_admin
  if (["admin", "system_admin"].includes(newRole) && callerRole !== "system_admin") {
    throw new Error("Only system_admin can assign admin roles");
  }

  const admin = createAdminClient();

  // Fetch target's current role
  const { data: target } = await admin
    .from("profiles")
    .select("role, username")
    .eq("id", targetUserId)
    .single();
  if (!target) throw new Error("User not found");

  // system_admin cannot demote another system_admin
  if (target.role === "system_admin" && callerRole !== "system_admin") {
    throw new Error("Cannot change a system_admin's role");
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", targetUserId);
  if (error) throw new Error(error.message);

  await logAdminAction("change_role", "user", targetUserId, {
    username: target.username,
    from: target.role,
    to: newRole,
  });

  revalidatePath("/admin/users");
}

// ── Ban / Unban ───────────────────────────────────────────────────────────────

export async function banUser(
  targetUserId: string,
  reason: string,
  bannedUntil?: string
): Promise<void> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role, username")
    .eq("id", targetUserId)
    .single();
  if (!target) throw new Error("User not found");
  if (["system_admin"].includes(target.role)) {
    throw new Error("Cannot ban a system_admin");
  }

  const { error } = await admin
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: reason,
      banned_until: bannedUntil ?? null,
      banned_by: user.id,
    })
    .eq("id", targetUserId);
  if (error) throw new Error(error.message);

  await logAdminAction("ban_user", "user", targetUserId, {
    username: target.username,
    reason,
    bannedUntil: bannedUntil ?? null,
  });

  revalidatePath("/admin/users");
}

export async function unbanUser(targetUserId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("username")
    .eq("id", targetUserId)
    .single();

  const { error } = await admin
    .from("profiles")
    .update({
      is_banned: false,
      ban_reason: null,
      banned_until: null,
      banned_by: null,
    })
    .eq("id", targetUserId);
  if (error) throw new Error(error.message);

  await logAdminAction("unban_user", "user", targetUserId, {
    username: target?.username,
  });

  revalidatePath("/admin/users");
}

// ── Verify / Unverify ─────────────────────────────────────────────────────────

export async function setUserVerified(
  targetUserId: string,
  verified: boolean
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ is_verified: verified })
    .eq("id", targetUserId);
  if (error) throw new Error(error.message);

  await logAdminAction(verified ? "verify_user" : "unverify_user", "user", targetUserId);
  revalidatePath("/admin/users");
}

// ── Delete user ───────────────────────────────────────────────────────────────

export async function deleteUser(targetUserId: string): Promise<void> {
  await requireSystemAdmin();
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role, username")
    .eq("id", targetUserId)
    .single();
  if (target?.role === "system_admin") {
    throw new Error("Cannot delete a system_admin");
  }

  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);

  await logAdminAction("delete_user", "user", targetUserId, {
    username: target?.username,
  });

  revalidatePath("/admin/users");
}

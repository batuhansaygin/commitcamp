"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalSnippets: number;
  totalComments: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  bannedUsers: number;
  adminCount: number;
  roleBreakdown: { role: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const admin = createAdminClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const [
    usersRes,
    postsRes,
    snippetsRes,
    commentsRes,
    newTodayRes,
    newWeekRes,
    bannedRes,
    roleRes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("posts").select("*", { count: "exact", head: true }),
    admin.from("snippets").select("*", { count: "exact", head: true }),
    admin.from("comments").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString()),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", true),
    admin
      .from("profiles")
      .select("role")
      .in("role", ["admin", "system_admin"]),
  ]);

  const adminCount = (roleRes.data ?? []).length;

  const roleBreakdownRaw = await admin.from("profiles").select("role");
  const roleCounts: Record<string, number> = {};
  for (const row of roleBreakdownRaw.data ?? []) {
    roleCounts[row.role] = (roleCounts[row.role] ?? 0) + 1;
  }
  const roleBreakdown = Object.entries(roleCounts).map(([role, count]) => ({
    role,
    count,
  }));

  return {
    totalUsers: usersRes.count ?? 0,
    totalPosts: postsRes.count ?? 0,
    totalSnippets: snippetsRes.count ?? 0,
    totalComments: commentsRes.count ?? 0,
    newUsersToday: newTodayRes.count ?? 0,
    newUsersThisWeek: newWeekRes.count ?? 0,
    bannedUsers: bannedRes.count ?? 0,
    adminCount,
    roleBreakdown,
  };
}

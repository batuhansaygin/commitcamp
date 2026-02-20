import { Suspense } from "react";
import { getDashboardStats } from "@/lib/actions/admin/dashboard";
import { getAuditLogs } from "@/lib/actions/admin/audit";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  FileCode,
  MessageSquare,
  MessagesSquare,
  UserX,
  UserCheck,
  TrendingUp,
  ShieldAlert,
  Activity,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "CommitCamp admin dashboard.",
};

async function DashboardContent() {
  const [stats, recentLogs] = await Promise.all([
    getDashboardStats(),
    getAuditLogs(10, 0),
  ]);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-cyan-400",
      sub: `+${stats.newUsersToday} today`,
    },
    {
      title: "Forum Posts",
      value: stats.totalPosts.toLocaleString(),
      icon: MessageSquare,
      color: "text-purple-400",
      sub: null,
    },
    {
      title: "Snippets",
      value: stats.totalSnippets.toLocaleString(),
      icon: FileCode,
      color: "text-emerald-400",
      sub: null,
    },
    {
      title: "Comments",
      value: stats.totalComments.toLocaleString(),
      icon: MessagesSquare,
      color: "text-orange-400",
      sub: null,
    },
    {
      title: "New This Week",
      value: stats.newUsersThisWeek.toLocaleString(),
      icon: TrendingUp,
      color: "text-blue-400",
      sub: "new users",
    },
    {
      title: "Banned Users",
      value: stats.bannedUsers.toLocaleString(),
      icon: UserX,
      color: "text-red-400",
      sub: null,
    },
    {
      title: "Admin Count",
      value: stats.adminCount.toLocaleString(),
      icon: ShieldAlert,
      color: "text-yellow-400",
      sub: "admins & system_admins",
    },
    {
      title: "Active Users",
      value: stats.newUsersToday.toLocaleString(),
      icon: Activity,
      color: "text-pink-400",
      sub: "joined today",
    },
  ];

  const roleColors: Record<string, string> = {
    user: "bg-muted text-muted-foreground",
    moderator: "bg-blue-500/15 text-blue-400",
    admin: "bg-purple-500/15 text-purple-400",
    system_admin: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live overview of the CommitCamp platform.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.sub && (
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Role breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">User Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.roleBreakdown
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ${
                      roleColors[item.role] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.role.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{
                          width: `${Math.min(100, (item.count / stats.totalUsers) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium tabular-nums">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Recent audit log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No admin actions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {recentLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono font-medium text-muted-foreground shrink-0">
                      {log.action}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {log.target_type && log.target_id
                        ? `${log.target_type}:${log.target_id.slice(0, 8)}…`
                        : "—"}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground/60">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

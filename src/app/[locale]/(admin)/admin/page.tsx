import { setRequestLocale } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, FileCode, MessageSquare, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "CommitCamp admin dashboard.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of the CommitCamp platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users", value: "—", icon: Users, color: "text-cyan-accent" },
          { title: "Snippets", value: "—", icon: FileCode, color: "text-purple-accent" },
          { title: "Forum Posts", value: "—", icon: MessageSquare, color: "text-green-accent" },
          { title: "Page Views", value: "—", icon: TrendingUp, color: "text-orange-accent" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">Connect Supabase to see data</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Connect Supabase to see recent activity.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

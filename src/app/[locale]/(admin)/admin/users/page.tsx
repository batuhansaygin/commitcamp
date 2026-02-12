import { setRequestLocale } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage CommitCamp users.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">View and manage platform users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Connect Supabase to see users. User data will appear here with role management.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { setRequestLocale } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Platform reports and analytics.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminReportsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Platform analytics and reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Analytics data will appear here after Supabase integration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

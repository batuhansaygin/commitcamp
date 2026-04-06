import { AdminRevenueDashboard } from "@/components/admin/admin-revenue-dashboard";
import { getRevenueAnalytics, type AnalyticsRange } from "@/lib/actions/admin/analytics";

interface AdminRevenuePageProps {
  searchParams: Promise<{ range?: string }>;
}

function parseRange(raw?: string): AnalyticsRange {
  if (raw === "7d" || raw === "30d" || raw === "90d" || raw === "all") return raw;
  return "30d";
}

export default async function AdminRevenuePage({ searchParams }: AdminRevenuePageProps) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const data = await getRevenueAnalytics(range);

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue</h1>
        <p className="text-sm text-muted-foreground">
          MRR, subscriptions, tool usage, conversion, marketplace, and referrals.
        </p>
      </div>
      <AdminRevenueDashboard data={data} range={range} />
    </div>
  );
}

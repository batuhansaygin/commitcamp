import { Card, CardContent } from "@/components/ui/card";
import { listSubscriptionsAdmin, getSubscriptionAdminStats } from "@/lib/actions/billing/subscriptions";

export default async function AdminSubscriptionsPage() {
  const [rows, stats] = await Promise.all([listSubscriptionsAdmin(), getSubscriptionAdminStats()]);

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Plan distribution and active subscription monitoring.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-sm">Total: <span className="font-semibold">{stats.total}</span></CardContent></Card>
        <Card><CardContent className="p-4 text-sm">Active: <span className="font-semibold">{stats.active}</span></CardContent></Card>
        <Card><CardContent className="p-4 text-sm">MRR: <span className="font-semibold">${(stats.mrr_cents / 100).toFixed(2)}</span></CardContent></Card>
        <Card><CardContent className="p-4 text-sm">Plans: <span className="font-semibold">{Object.keys(stats.planDistribution).length}</span></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Period End</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{r.user_id}</td>
                    <td className="px-4 py-3">{r.plan}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.current_period_end ? new Date(r.current_period_end).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

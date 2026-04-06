"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsRange, RevenueAnalyticsPayload } from "@/lib/actions/admin/analytics";

interface AdminRevenueDashboardProps {
  data: RevenueAnalyticsPayload;
  range: AnalyticsRange;
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export function AdminRevenueDashboard({ data, range }: AdminRevenueDashboardProps) {
  const mrrChartData = data.mrrTrend.map((r) => ({
    month: r.month.slice(2),
    mrr: Math.round(r.mrrCents / 100),
    active: r.activeCount,
  }));

  const gmvChartData = data.gmvTrend.map((r) => ({
    month: r.month.slice(2),
    gmv: Math.round(r.gmvCents / 100),
    commission: Math.round(r.commissionCents / 100),
  }));

  const toolChartData = data.toolUsage.map((t) => ({ ...t, name: t.tool.replaceAll("_", " ") }));
  const sellerData = data.topSellers.map((s) => ({ name: s.sellerName, gmv: Math.round(s.gmvCents / 100) }));
  const funnelData = data.conversionFunnel.map((f) => ({ name: f.step, value: f.count }));
  const referralData = data.referralFunnel.map((f) => ({ name: f.step, count: f.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((opt) => {
          const active = opt.value === range;
          return (
            <a
              key={opt.value}
              href={`/admin/revenue?range=${opt.value}`}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </a>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">MRR</p><p className="text-lg font-semibold">{money(data.summary.mrrCents)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active subscribers</p><p className="text-lg font-semibold">{data.summary.activeSubscribers.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Marketplace GMV</p><p className="text-lg font-semibold">{money(data.summary.gmvCents)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tool usage / day</p><p className="text-lg font-semibold">{data.summary.avgDailyToolUsage.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rewarded referrals</p><p className="text-lg font-semibold">{data.summary.rewardedReferrals.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="funnel">Conversion</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>MRR Trend</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Marketplace GMV & Commission</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gmvChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="gmv" fill="hsl(var(--primary))" />
                  <Bar dataKey="commission" fill="hsl(var(--muted-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tool Usage Distribution</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toolChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top 5 Sellers by GMV</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellerData} layout="vertical" margin={{ left: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="gmv" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Referral Funnel</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referralData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Viral coefficient</p>
              <p className="text-2xl font-semibold">{data.viralCoefficient.toFixed(2)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Completed + rewarded referrals divided by unique referrers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

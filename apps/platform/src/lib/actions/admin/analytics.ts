"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

interface SubRow {
  user_id: string;
  plan: "free" | "pro" | "team";
  status: "active" | "cancelled" | "past_due" | "trialing";
  created_at: string;
}

interface UsageRow {
  user_id: string;
  tool: string;
  created_at: string;
}

interface PurchaseRow {
  amount_cents: number;
  commission_cents: number;
  product_id: string;
  created_at: string;
}

interface ProductRow {
  id: string;
  seller_id: string;
}

interface ReferralRow {
  referrer_id: string;
  status: "pending" | "completed" | "rewarded";
  created_at: string;
}

function getRangeStart(range: AnalyticsRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function monthKey(dateIso: string): string {
  const d = new Date(dateIso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthKeysBack(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(monthKey(d.toISOString()));
  }
  return keys;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "system_admin"].includes(profile.role)) throw new Error("Forbidden");
}

export interface RevenueAnalyticsPayload {
  range: AnalyticsRange;
  summary: {
    mrrCents: number;
    activeSubscribers: number;
    gmvCents: number;
    avgDailyToolUsage: number;
    rewardedReferrals: number;
  };
  mrrTrend: Array<{ month: string; mrrCents: number; activeCount: number }>;
  toolUsage: Array<{ tool: string; count: number }>;
  conversionFunnel: Array<{ step: string; count: number }>;
  gmvTrend: Array<{ month: string; gmvCents: number; commissionCents: number }>;
  topSellers: Array<{ sellerId: string; sellerName: string; gmvCents: number; sales: number }>;
  referralFunnel: Array<{ step: string; count: number }>;
  viralCoefficient: number;
}

export async function getRevenueAnalytics(range: AnalyticsRange = "30d"): Promise<RevenueAnalyticsPayload> {
  await requireAdmin();
  const admin = createAdminClient();
  const start = getRangeStart(range);
  const months = monthKeysBack(12);

  let subsQ = admin
    .from("subscriptions")
    .select("user_id,plan,status,created_at")
    .in("status", ["active", "trialing"]);
  let usageQ = admin.from("usage_tracking").select("user_id,tool,created_at");
  let purchasesQ = admin
    .from("purchases")
    .select("amount_cents,commission_cents,product_id,created_at")
    .eq("status", "completed");
  let referralsQ = admin.from("referrals").select("referrer_id,status,created_at");
  let trialQ = admin.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("status", "trialing");
  let activeQ = admin.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("status", "active");

  if (start) {
    subsQ = subsQ.gte("created_at", start);
    usageQ = usageQ.gte("created_at", start);
    purchasesQ = purchasesQ.gte("created_at", start);
    referralsQ = referralsQ.gte("created_at", start);
    trialQ = trialQ.gte("created_at", start);
    activeQ = activeQ.gte("created_at", start);
  }

  const [{ data: subs }, { data: usage }, { data: purchases }, { data: products }, { data: profiles }, { data: referrals }, usersCountRes, trialCountRes, activeCountRes] =
    await Promise.all([
      subsQ,
      usageQ,
      purchasesQ,
      admin.from("products").select("id,seller_id"),
      admin.from("profiles").select("id,display_name,username"),
      referralsQ,
      admin.from("profiles").select("id", { count: "exact", head: true }),
      trialQ,
      activeQ,
    ]);

  const subRows = (subs ?? []) as SubRow[];
  const usageRows = (usage ?? []) as UsageRow[];
  const purchaseRows = (purchases ?? []) as PurchaseRow[];
  const productRows = (products ?? []) as ProductRow[];
  const referralRows = (referrals ?? []) as ReferralRow[];

  const mrrByMonth = new Map<string, { mrrCents: number; activeCount: number }>();
  for (const m of months) mrrByMonth.set(m, { mrrCents: 0, activeCount: 0 });
  for (const s of subRows) {
    const key = monthKey(s.created_at);
    if (!mrrByMonth.has(key)) continue;
    const value = s.plan === "pro" ? 1200 : s.plan === "team" ? 2900 : 0;
    const bucket = mrrByMonth.get(key)!;
    bucket.mrrCents += value;
    bucket.activeCount += 1;
  }
  const mrrTrend = months.map((m) => ({ month: m, ...mrrByMonth.get(m)! }));

  const toolMap = new Map<string, number>();
  for (const u of usageRows) toolMap.set(u.tool, (toolMap.get(u.tool) ?? 0) + 1);
  const toolUsage = [...toolMap.entries()]
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);

  const totalUsers = usersCountRes.count ?? 0;
  const freeToolUsers = new Set(usageRows.map((u) => u.user_id)).size;
  const trialUsers = trialCountRes.count ?? 0;
  const proUsers = activeCountRes.count ?? 0;
  const conversionFunnel = [
    { step: "Total users", count: totalUsers },
    { step: "Used free tools", count: freeToolUsers },
    { step: "Trial started", count: trialUsers },
    { step: "Pro active", count: proUsers },
  ];

  const gmvByMonth = new Map<string, { gmvCents: number; commissionCents: number }>();
  for (const m of months) gmvByMonth.set(m, { gmvCents: 0, commissionCents: 0 });
  let gmvCents = 0;
  let commissionCents = 0;
  for (const p of purchaseRows) {
    const key = monthKey(p.created_at);
    if (gmvByMonth.has(key)) {
      const bucket = gmvByMonth.get(key)!;
      bucket.gmvCents += p.amount_cents;
      bucket.commissionCents += p.commission_cents;
    }
    gmvCents += p.amount_cents;
    commissionCents += p.commission_cents;
  }
  const gmvTrend = months.map((m) => ({ month: m, ...gmvByMonth.get(m)! }));

  const productSeller = new Map(productRows.map((p) => [p.id, p.seller_id]));
  const sellerAgg = new Map<string, { gmvCents: number; sales: number }>();
  for (const p of purchaseRows) {
    const sellerId = productSeller.get(p.product_id);
    if (!sellerId) continue;
    const current = sellerAgg.get(sellerId) ?? { gmvCents: 0, sales: 0 };
    current.gmvCents += p.amount_cents;
    current.sales += 1;
    sellerAgg.set(sellerId, current);
  }
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name || p.username || p.id.slice(0, 8)])
  );
  const topSellers = [...sellerAgg.entries()]
    .map(([sellerId, s]) => ({
      sellerId,
      sellerName: profileMap.get(sellerId) ?? sellerId.slice(0, 8),
      gmvCents: s.gmvCents,
      sales: s.sales,
    }))
    .sort((a, b) => b.gmvCents - a.gmvCents)
    .slice(0, 5);

  const pending = referralRows.filter((r) => r.status === "pending").length;
  const completed = referralRows.filter((r) => r.status === "completed").length;
  const rewarded = referralRows.filter((r) => r.status === "rewarded").length;
  const referralFunnel = [
    { step: "Pending", count: pending },
    { step: "Completed", count: completed },
    { step: "Rewarded", count: rewarded },
  ];

  const uniqueReferrers = new Set(referralRows.map((r) => r.referrer_id)).size;
  const totalReferred = completed + rewarded;
  const viralCoefficient = uniqueReferrers > 0 ? Number((totalReferred / uniqueReferrers).toFixed(2)) : 0;

  const dayDenominator = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 30;
  const avgDailyToolUsage = Math.round(usageRows.length / dayDenominator);

  return {
    range,
    summary: {
      mrrCents: mrrTrend.reduce((sum, r) => sum + r.mrrCents, 0),
      activeSubscribers: subRows.length,
      gmvCents,
      avgDailyToolUsage,
      rewardedReferrals: rewarded,
    },
    mrrTrend,
    toolUsage,
    conversionFunnel,
    gmvTrend,
    topSellers,
    referralFunnel,
    viralCoefficient,
  };
}

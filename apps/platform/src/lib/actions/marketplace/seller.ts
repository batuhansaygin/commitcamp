"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMarketplaceEnabled, requireAdmin, requireUser } from "./_common";

export async function getSellerStats() {
  if (!(await ensureMarketplaceEnabled())) return { products: 0, sales: 0, revenue_cents: 0, commission_cents: 0 };
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: products } = await admin
    .from("products")
    .select("id, price_cents")
    .eq("seller_id", user.id);
  const productIds = (products ?? []).map((p) => p.id);

  if (productIds.length === 0) {
    return { products: 0, sales: 0, revenue_cents: 0, commission_cents: 0 };
  }

  const { data: purchases } = await admin
    .from("purchases")
    .select("amount_cents, commission_cents")
    .in("product_id", productIds)
    .eq("status", "completed");

  const sales = purchases?.length ?? 0;
  const revenue = (purchases ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
  const commission = (purchases ?? []).reduce((sum, p) => sum + p.commission_cents, 0);

  return {
    products: productIds.length,
    sales,
    revenue_cents: revenue,
    commission_cents: commission,
  };
}

export async function getRevenueSummaryAdmin() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: purchases }, { data: subscriptions }] = await Promise.all([
    admin
      .from("purchases")
      .select("amount_cents, commission_cents, status")
      .eq("status", "completed"),
    admin
      .from("subscriptions")
      .select("plan,status")
      .in("status", ["active", "trialing"]),
  ]);

  const marketplaceRevenue = (purchases ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
  const marketplaceCommission = (purchases ?? []).reduce((sum, p) => sum + p.commission_cents, 0);
  const mrr = (subscriptions ?? []).reduce((sum, s) => {
    if (s.plan === "pro") return sum + 1200;
    if (s.plan === "team") return sum + 2900;
    return sum;
  }, 0);

  return {
    mrr_cents: mrr,
    marketplace_revenue_cents: marketplaceRevenue,
    marketplace_commission_cents: marketplaceCommission,
    total_revenue_cents: mrr + marketplaceRevenue,
  };
}

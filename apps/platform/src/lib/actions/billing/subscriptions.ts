"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CheckoutPlan = "pro" | "team";
const TRIAL_DAYS = 7;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key);
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getPriceId(plan: CheckoutPlan) {
  const priceId = plan === "pro" ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_TEAM_PRICE_ID;
  if (!priceId) throw new Error(`Missing Stripe price id for plan: ${plan}`);
  return priceId;
}

export async function createCheckout(plan: CheckoutPlan) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/pricing")}`);
  }

  const admin = createAdminClient();
  const stripe = getStripe();
  const baseUrl = getSiteUrl();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    success_url: `${baseUrl}/settings?billing=success`,
    cancel_url: `${baseUrl}/pricing?billing=cancelled`,
    metadata: {
      user_id: user.id,
      plan,
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");

  return { url: session.url };
}

export async function startProTrial() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/pricing")}`);
  }

  const admin = createAdminClient();
  const stripe = getStripe();
  const baseUrl = getSiteUrl();

  const { data: existing } = await admin
    .from("subscriptions")
    .select("plan,status,trial_end,stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.plan === "pro" && (existing.status === "active" || existing.status === "trialing")) {
    return { alreadySubscribed: true as const };
  }

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPriceId("pro"), quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { user_id: user.id, plan: "pro", is_trial: "true" },
    },
    success_url: `${baseUrl}/settings?billing=trial_started`,
    cancel_url: `${baseUrl}/pricing?billing=cancelled`,
    metadata: {
      user_id: user.id,
      plan: "pro",
      is_trial: "true",
    },
  });

  if (!session.url) throw new Error("Failed to create trial checkout session.");
  return { url: session.url };
}

export async function getSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("id,plan,status,current_period_start,current_period_end,cancel_at_period_end,trial_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listSubscriptionsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    throw new Error("Forbidden");
  }

  const { data } = await admin
    .from("subscriptions")
    .select("id,user_id,plan,status,current_period_end,trial_end,created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSubscriptionAdminStats() {
  const rows = await listSubscriptionsAdmin();
  const planDistribution = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.plan] = (acc[row.plan] ?? 0) + 1;
    return acc;
  }, {});
  const active = rows.filter((r) => r.status === "active" || r.status === "trialing");
  const mrr = active.reduce((sum, r) => {
    if (r.plan === "pro") return sum + 1200;
    if (r.plan === "team") return sum + 2900;
    return sum;
  }, 0);
  return {
    total: rows.length,
    active: active.length,
    mrr_cents: mrr,
    planDistribution,
  };
}

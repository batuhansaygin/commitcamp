"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_LEN = 8;

function randomInviteCode(): string {
  let out = "";
  for (let i = 0; i < INVITE_LEN; i++) {
    out += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return out;
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

async function resolveAuditActorId(): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "system_admin")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function logReferralAudit(action: string, metadata: Record<string, unknown>) {
  const actorId = await resolveAuditActorId();
  if (!actorId) return;
  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    admin_id: actorId,
    action,
    target_type: "referral",
    target_id: String(metadata.referral_id ?? metadata.referred_id ?? ""),
    metadata,
  });
}

/** Ensure the current user has a profile invite code; return link + code. */
export async function generateInviteLink(): Promise<{
  code: string;
  inviteUrl: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { code: "", inviteUrl: "", error: "Unauthorized" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("invite_code")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.invite_code) {
    const base = getSiteUrl();
    return {
      code: profile.invite_code,
      inviteUrl: `${base}/signup?ref=${encodeURIComponent(profile.invite_code)}`,
    };
  }

  for (let attempt = 0; attempt < 24; attempt++) {
    const code = randomInviteCode();
    const { data: updated, error } = await admin
      .from("profiles")
      .update({ invite_code: code, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("invite_code", null)
      .select("invite_code")
      .maybeSingle();

    if (!error && updated?.invite_code) {
      const base = getSiteUrl();
      return {
        code: updated.invite_code,
        inviteUrl: `${base}/signup?ref=${encodeURIComponent(updated.invite_code)}`,
      };
    }

    const { data: race } = await admin.from("profiles").select("invite_code").eq("id", user.id).maybeSingle();
    if (race?.invite_code) {
      const base = getSiteUrl();
      return {
        code: race.invite_code,
        inviteUrl: `${base}/signup?ref=${encodeURIComponent(race.invite_code)}`,
      };
    }
  }

  return { code: "", inviteUrl: "", error: "Could not generate invite code" };
}

export async function applyReferralCode(rawCode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeCode(rawCode);
  if (code.length < 4) return { ok: false, error: "Invalid code" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required" };

  const admin = createAdminClient();

  const { data: meProfile } = await admin
    .from("profiles")
    .select("invite_code")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.invite_code && normalizeCode(meProfile.invite_code) === code) {
    return { ok: false, error: "You cannot use your own code" };
  }

  const { data: existingReferred } = await admin
    .from("referrals")
    .select("id")
    .eq("referred_id", user.id)
    .maybeSingle();
  if (existingReferred) return { ok: false, error: "Referral already applied" };

  const { data: referrerProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();

  if (!referrerProfile?.id) return { ok: false, error: "Unknown invite code" };

  if (referrerProfile.id === user.id) return { ok: false, error: "You cannot use your own code" };

  const { error: insertErr } = await admin.from("referrals").insert({
    referrer_id: referrerProfile.id,
    referred_id: user.id,
    invite_code: code,
    status: "pending",
  });

  if (insertErr) {
    if (insertErr.code === "23505") return { ok: false, error: "Referral already applied" };
    return { ok: false, error: insertErr.message };
  }

  await logReferralAudit("referral_applied", {
    referred_id: user.id,
    referrer_id: referrerProfile.id,
    invite_code: code,
  });

  return { ok: true };
}

/**
 * When the referred user becomes a Pro subscriber (checkout completed), reward the referrer once.
 * Idempotent via referral status.
 */
export async function checkAndRewardReferral(referredUserId: string, plan: string): Promise<void> {
  if (plan !== "pro") return;

  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: pending } = await admin
    .from("referrals")
    .select("id, referrer_id")
    .eq("referred_id", referredUserId)
    .eq("status", "pending")
    .maybeSingle();

  if (!pending) return;

  const now = new Date().toISOString();

  const { data: updated, error: updErr } = await admin
    .from("referrals")
    .update({
      status: "rewarded",
      completed_at: now,
      rewarded_at: now,
      reward_type: "free_month",
    })
    .eq("id", pending.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updErr || !updated) return;

  const referrerId = pending.referrer_id;

  if (stripe) {
    try {
      const { data: subRow } = await admin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", referrerId)
        .maybeSingle();

      const customerId = subRow?.stripe_customer_id;
      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) {
          const bal = customer.balance ?? 0;
          await stripe.customers.update(customerId, { balance: bal - 1200 });
        }
      }
    } catch {
      /* non-fatal */
    }
  }

  const { data: hasFirst } = await admin
    .from("user_achievements")
    .select("id")
    .eq("user_id", referrerId)
    .eq("achievement_id", "referral_first")
    .maybeSingle();

  if (!hasFirst) {
    await admin.rpc("increment_xp", {
      p_user_id: referrerId,
      p_amount: 100,
      p_reason: "referral_reward",
    });

    const { error: achErr } = await admin.from("user_achievements").insert({
      user_id: referrerId,
      achievement_id: "referral_first",
    });
    if (achErr && achErr.code !== "23505") {
      /* duplicate race — ignore */
    }

    await admin.from("notifications").insert({
      user_id: referrerId,
      actor_id: null,
      type: "achievement",
      post_id: null,
      comment_id: null,
      message: "Achievement unlocked: Networker — your first referral subscribed to Pro.",
    });
  } else {
    await admin.from("notifications").insert({
      user_id: referrerId,
      actor_id: null,
      type: "achievement",
      post_id: null,
      comment_id: null,
      message: "Another friend subscribed to Pro — billing credit applied to your account.",
    });
  }

  await logReferralAudit("referral_rewarded", {
    referral_id: pending.id,
    referrer_id: referrerId,
    referred_id: referredUserId,
    plan,
  });
}

export async function getReferralPanelData(): Promise<{
  inviteUrl: string;
  code: string;
  rewardedCount: number;
  pendingCount: number;
  hasAppliedReferral: boolean;
  error?: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const link = await generateInviteLink();
  if (link.error || !link.code) {
    return {
      inviteUrl: "",
      code: "",
      rewardedCount: 0,
      pendingCount: 0,
      hasAppliedReferral: false,
      error: link.error,
    };
  }

  const admin = createAdminClient();

  const [{ count: rewardedCount }, { count: pendingCount }, { data: asReferred }] =
    await Promise.all([
      admin
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .eq("status", "rewarded"),
      admin
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .eq("status", "pending"),
      admin.from("referrals").select("id").eq("referred_id", user.id).maybeSingle(),
    ]);

  return {
    inviteUrl: link.inviteUrl,
    code: link.code,
    rewardedCount: rewardedCount ?? 0,
    pendingCount: pendingCount ?? 0,
    hasAppliedReferral: !!asReferred,
  };
}

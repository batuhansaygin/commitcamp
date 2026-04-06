"use server";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndRewardReferral } from "@/lib/actions/referral/referral";
import { sendEmail } from "@/lib/email/mailer";
import { trialEndingEmail } from "@/lib/email/templates";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key);
}

async function resolveAuditActorId() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "system_admin")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function logWebhookAudit(action: string, metadata: Record<string, unknown>) {
  const actorId = await resolveAuditActorId();
  if (!actorId) return;
  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    admin_id: actorId,
    action,
    target_type: "stripe_webhook",
    target_id: String(metadata.event_id ?? ""),
    metadata,
  });
}

export async function handleStripeWebhook(rawBody: string, signature: string) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const mode = session.mode;
      const userId = session.metadata?.user_id;

      if (mode === "subscription" && userId) {
        const plan = (session.metadata?.plan as "free" | "pro" | "team" | undefined) ?? "pro";
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        let trialEnd: string | null = null;

        if (subscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          trialEnd = stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000).toISOString()
            : null;
        }

        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: trialEnd ? "trialing" : "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            trial_end: trialEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (plan === "pro") {
          await checkAndRewardReferral(userId, plan);
        }
      }

      if (mode === "payment" && userId) {
        const productId = session.metadata?.product_id;
        const paymentId = session.payment_intent;
        const amountCents = Number(session.metadata?.amount_cents ?? 0);
        const commissionCents = Number(session.metadata?.commission_cents ?? 0);
        const sellerPayoutCents = Number(session.metadata?.seller_payout_cents ?? 0);

        if (productId) {
          await admin.from("purchases").upsert(
            {
              buyer_id: userId,
              product_id: productId,
              amount_cents: amountCents,
              commission_cents: commissionCents,
              seller_payout_cents: sellerPayoutCents,
              stripe_payment_id: typeof paymentId === "string" ? paymentId : null,
              status: "completed",
            },
            { onConflict: "buyer_id,product_id" }
          );
        }
      }

      await logWebhookAudit("stripe_checkout_completed", {
        event_id: event.id,
        mode,
        session_id: session.id,
        user_id: session.metadata?.user_id ?? null,
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const mapStatus = () => {
        if (event.type === "customer.subscription.deleted") return "cancelled";
        if (subscription.status === "active") return "active";
        if (subscription.status === "trialing") return "trialing";
        if (subscription.status === "past_due") return "past_due";
        return "cancelled";
      };
      const status = mapStatus();
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null;

      await admin
        .from("subscriptions")
        .update({
          status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_end: trialEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      await logWebhookAudit("stripe_subscription_changed", {
        event_id: event.id,
        subscription_id: subscription.id,
        status,
      });
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: row } = await admin
        .from("subscriptions")
        .select("user_id,trial_end")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle();

      if (row?.user_id) {
        const { data: profile } = await admin
          .from("profiles")
          .select("email,display_name")
          .eq("id", row.user_id)
          .maybeSingle();

        if (profile?.email) {
          const tpl = trialEndingEmail({
            recipientName: profile.display_name ?? "Developer",
            trialEnd: row.trial_end ?? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            pricingUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://commitcamp.com"}/pricing`,
          });
          await sendEmail({ to: profile.email, subject: tpl.subject, html: tpl.html });
        }
      }

      await logWebhookAudit("stripe_trial_will_end", {
        event_id: event.id,
        subscription_id: subscription.id,
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceRaw = invoice as unknown as Record<string, unknown>;
      const subscriptionValue = invoiceRaw["subscription"];
      const subscriptionId =
        typeof subscriptionValue === "string" ? subscriptionValue : null;
      if (subscriptionId) {
        await admin
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
      await logWebhookAudit("stripe_invoice_failed", {
        event_id: event.id,
        invoice_id: invoice.id,
        subscription_id: subscriptionId,
      });
      break;
    }
    default: {
      await logWebhookAudit("stripe_unhandled_event", {
        event_id: event.id,
        event_type: event.type,
      });
    }
  }

  return { received: true, type: event.type };
}

"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMarketplaceEnabled, requireUser } from "./_common";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key);
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function purchaseProduct(productId: string) {
  if (!(await ensureMarketplaceEnabled())) throw new Error("Marketplace is disabled");
  const user = await requireUser();
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: product } = await admin
    .from("products")
    .select("id,title,price_cents,currency,seller_id,is_published")
    .eq("id", productId)
    .single();
  if (!product || !product.is_published) throw new Error("Product not available.");

  const commission = Math.round(product.price_cents * 0.15);
  const sellerPayout = product.price_cents - commission;
  const baseUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: product.currency || "usd",
          unit_amount: product.price_cents,
          product_data: { name: product.title },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/marketplace/my-purchases?purchase=success`,
    cancel_url: `${baseUrl}/marketplace/${productId}?purchase=cancelled`,
    metadata: {
      user_id: user.id,
      product_id: product.id,
      seller_id: product.seller_id,
      amount_cents: String(product.price_cents),
      commission_cents: String(commission),
      seller_payout_cents: String(sellerPayout),
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session.");
  return { url: session.url };
}

export async function getPurchaseHistory() {
  if (!(await ensureMarketplaceEnabled())) return [];
  const user = await requireUser();
  const admin = createAdminClient();

  const { data } = await admin
    .from("purchases")
    .select("id, product_id, amount_cents, status, created_at, products(title, slug, file_path)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function downloadProduct(productId: string) {
  if (!(await ensureMarketplaceEnabled())) throw new Error("Marketplace is disabled");
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: purchase } = await admin
    .from("purchases")
    .select("id,status")
    .eq("buyer_id", user.id)
    .eq("product_id", productId)
    .eq("status", "completed")
    .maybeSingle();
  if (!purchase) throw new Error("You have not purchased this product.");

  const { data: product } = await admin
    .from("products")
    .select("file_path,download_count")
    .eq("id", productId)
    .single();
  if (!product?.file_path) throw new Error("No downloadable file found.");

  const { data, error } = await admin.storage
    .from("product-files")
    .createSignedUrl(product.file_path, 60 * 15);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Failed to create download URL.");

  await admin
    .from("products")
    .update({ download_count: (product.download_count ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq("id", productId);

  return { url: data.signedUrl };
}

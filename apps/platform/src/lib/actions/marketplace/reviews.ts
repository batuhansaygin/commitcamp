"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureMarketplaceEnabled, requireUser } from "./_common";

export async function addReview(productId: string, rating: number, comment?: string) {
  if (!(await ensureMarketplaceEnabled())) throw new Error("Marketplace is disabled");
  const user = await requireUser();
  const admin = createAdminClient();

  const { error } = await admin.from("product_reviews").upsert(
    {
      product_id: productId,
      reviewer_id: user.id,
      rating,
      comment: comment ?? null,
    },
    { onConflict: "product_id,reviewer_id" }
  );
  if (error) throw new Error(error.message);

  const { data: reviews } = await admin
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId);

  const count = reviews?.length ?? 0;
  const avg = count === 0 ? 0 : Number(((reviews ?? []).reduce((s, r) => s + r.rating, 0) / count).toFixed(2));

  await admin
    .from("products")
    .update({ rating_avg: avg, rating_count: count, updated_at: new Date().toISOString() })
    .eq("id", productId);

  return { success: true };
}

export async function getProductReviews(productId: string) {
  if (!(await ensureMarketplaceEnabled())) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("product_reviews")
    .select("id, rating, comment, created_at, reviewer_id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((data ?? []).map((r) => r.reviewer_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (data ?? []).map((r) => ({
    ...r,
    reviewer: profileMap.get(r.reviewer_id) ?? null,
  }));
}

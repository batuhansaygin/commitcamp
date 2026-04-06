"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/actions/admin/audit";
import { ensureMarketplaceEnabled, requireAdmin, requireUser, slugify } from "./_common";

type ProductType = "template" | "cheatsheet" | "course" | "snippet_pack" | "tool";

export interface ProductInput {
  title: string;
  description?: string;
  long_description?: string;
  price_cents: number;
  type: ProductType;
  tags?: string[];
  preview_url?: string;
  thumbnail_url?: string;
}

export async function listProducts(params?: {
  query?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}) {
  if (!(await ensureMarketplaceEnabled())) return [];
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, slug, title, description, price_cents, currency, type, thumbnail_url, rating_avg, rating_count, seller_id, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (params?.query) query = query.ilike("title", `%${params.query}%`);
  if (params?.type) query = query.eq("type", params.type);
  if (typeof params?.minPrice === "number") query = query.gte("price_cents", params.minPrice);
  if (typeof params?.maxPrice === "number") query = query.lte("price_cents", params.maxPrice);
  if (typeof params?.minRating === "number") query = query.gte("rating_avg", params.minRating);

  const { data } = await query;
  return data ?? [];
}

export async function getProduct(productIdOrSlug: string) {
  if (!(await ensureMarketplaceEnabled())) return null;
  const supabase = await createClient();
  const { data: byId } = await supabase
    .from("products")
    .select("*")
    .eq("id", productIdOrSlug)
    .maybeSingle();
  if (byId) return byId;

  const { data: bySlug } = await supabase
    .from("products")
    .select("*")
    .eq("slug", productIdOrSlug)
    .maybeSingle();
  return bySlug ?? null;
}

export async function createProduct(input: ProductInput, file?: File) {
  if (!(await ensureMarketplaceEnabled())) throw new Error("Marketplace is disabled");
  const user = await requireUser();
  const admin = createAdminClient();
  const slugBase = slugify(input.title);
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

  let filePath: string | null = null;
  if (file) {
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
    filePath = `${user.id}/${slug}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("product-files")
      .upload(filePath, bytes, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (uploadError) throw new Error(uploadError.message);
  }

  const { data, error } = await admin
    .from("products")
    .insert({
      seller_id: user.id,
      title: input.title,
      slug,
      description: input.description ?? null,
      long_description: input.long_description ?? null,
      price_cents: input.price_cents,
      type: input.type,
      tags: input.tags ?? [],
      preview_url: input.preview_url ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      file_path: filePath,
      is_published: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/marketplace");
  revalidatePath("/marketplace/my-products");
  return data;
}

export async function updateProduct(productId: string, updates: Partial<ProductInput>) {
  if (!(await ensureMarketplaceEnabled())) throw new Error("Marketplace is disabled");
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("seller_id")
    .eq("id", productId)
    .single();
  if (!product || product.seller_id !== user.id) throw new Error("Forbidden");

  const { error } = await admin
    .from("products")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${productId}`);
  revalidatePath("/marketplace/my-products");
}

export async function getMyProducts() {
  if (!(await ensureMarketplaceEnabled())) return [];
  const user = await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listProductsAdmin() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id,title,slug,type,price_cents,is_published,is_featured,seller_id,file_path,created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function approveProduct(productId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("products")
    .select("file_path,price_cents")
    .eq("id", productId)
    .maybeSingle();
  if (!row) throw new Error("Product not found");
  if (row.price_cents > 0 && !row.file_path) {
    throw new Error("Paid products need a storage file (file_path) before approval.");
  }
  const { error } = await admin
    .from("products")
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  await logAdminAction("approve_product", "product", productId);
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
}

export async function rejectProduct(productId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  await logAdminAction("reject_product", "product", productId);
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
}

export async function removeProduct(productId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  await logAdminAction("remove_product", "product", productId);
  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
}

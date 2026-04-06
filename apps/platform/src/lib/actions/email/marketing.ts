"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/mailer";
import { newMarketplaceProductEmail, weeklyToolDigestEmail } from "@/lib/email/templates";

async function requireAdminSender() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "system_admin"].includes(profile.role)) throw new Error("Forbidden");
}

export async function sendNewProductAnnouncement(productId: string) {
  await requireAdminSender();
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id,slug,title")
    .eq("id", productId)
    .single();
  if (!product) throw new Error("Product not found");

  const { data: subscribers } = await admin
    .from("profiles")
    .select("display_name,email")
    .not("email", "is", null)
    .limit(50);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://commitcamp.com";
  const productUrl = `${baseUrl}/marketplace/${product.slug}`;

  // Placeholder distribution path: this function intentionally limits volume.
  for (const row of subscribers ?? []) {
    const email = row.email;
    if (!email) continue;
    const tpl = newMarketplaceProductEmail({
      recipientName: row.display_name ?? "Developer",
      productTitle: product.title,
      productUrl,
    });
    await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
  }
}

export async function sendWeeklyToolsDigest(highlights: string[]) {
  await requireAdminSender();
  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("display_name,email")
    .not("email", "is", null)
    .limit(50);

  for (const row of users ?? []) {
    const email = row.email;
    if (!email) continue;
    const tpl = weeklyToolDigestEmail({
      recipientName: row.display_name ?? "Developer",
      highlights,
    });
    await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
  }
}

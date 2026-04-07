"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Clears Supabase auth cookies via the server client (required for @supabase/ssr + Next.js).
 * Client-only signOut() often leaves session cookies, so middleware still sees the user.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect("/");
}

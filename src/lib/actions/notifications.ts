"use server";

import { createClient } from "@/lib/supabase/server";

/** Get unread notification count for the current user. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

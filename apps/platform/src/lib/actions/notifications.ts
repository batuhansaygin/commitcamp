"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Notification, CreateNotificationInput } from "@/lib/types/notifications";

// ── Queries ──

/** Fetch paginated notifications for a user with joined actor and post data. */
export async function getNotifications(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ data: Notification[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey ( username, display_name, avatar_url, level ),
      post:posts!notifications_post_id_fkey ( title, type )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Notification[], error: null };
}

/** Get the unread notification count for the current authenticated user. */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

// ── Mutations ──

/**
 * Insert a new notification.
 * Silently skips if actor_id === user_id (no self-notifications).
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  if (input.actor_id && input.actor_id === input.user_id) return;

  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      user_id: input.user_id,
      actor_id: input.actor_id ?? null,
      type: input.type,
      post_id: input.post_id ?? null,
      comment_id: input.comment_id ?? null,
      message: input.message,
    });
  } catch {
    // Notification failures are non-critical — do not propagate
  }
}

/** Mark a single notification as read (ownership verified). */
export async function markNotificationRead(
  notificationId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/notifications");
    return {};
  } catch {
    return { error: "An error occurred." };
  }
}

/** Mark all unread notifications as read for the current user. */
export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) return { error: error.message };
    revalidatePath("/notifications");
    return {};
  } catch {
    return { error: "An error occurred." };
  }
}

/** Delete a notification (ownership verified). */
export async function deleteNotification(
  notificationId: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/notifications");
    return {};
  } catch {
    return { error: "An error occurred." };
  }
}

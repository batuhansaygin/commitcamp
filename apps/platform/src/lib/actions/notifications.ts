"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mailer";
import {
  likeNotificationEmail,
  commentNotificationEmail,
  followNotificationEmail,
  levelUpNotificationEmail,
} from "@/lib/email/templates";
import type { Notification, CreateNotificationInput } from "@/lib/types/notifications";

// ── In-App Notification Queries & Mutations ───────────────────────────────────

/** Fetch the latest notifications for a given user (public or own). */
export async function getNotifications(
  userId: string,
  limit = 50,
  offset = 0
): Promise<{ data: Notification[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id, user_id, actor_id, type, post_id, comment_id, message, is_read, created_at,
       actor:actor_id (username, display_name, avatar_url, level),
       post:post_id (title, type)`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as unknown as Notification[], error: null };
}

/** Get the count of unread notifications for the currently authenticated user. */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Mark a single notification as read. */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  } catch {
    // Non-critical
  }
}

/** Mark all notifications as read for the current user. */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    revalidatePath("/");
  } catch {
    // Non-critical
  }
}

/** Create an in-app notification. */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert(input);
  } catch {
    // Non-critical
  }
}

type NotificationKey = "likes" | "comments" | "follows" | "level_up";

interface EmailNotificationPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  level_up: boolean;
}

const DEFAULT_EMAIL_PREFS: EmailNotificationPrefs = {
  likes: true,
  comments: true,
  follows: true,
  level_up: true,
};

/** Fetch a user's email and email notification preferences. */
async function getUserEmailData(userId: string): Promise<{
  email: string | null;
  prefs: EmailNotificationPrefs;
} | null> {
  const admin = createAdminClient();

  const [authRes, profileRes] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("profiles")
      .select("email_notification_preferences")
      .eq("id", userId)
      .single(),
  ]);

  if (authRes.error || !authRes.data.user?.email) return null;

  const prefs: EmailNotificationPrefs = {
    ...DEFAULT_EMAIL_PREFS,
    ...(profileRes.data?.email_notification_preferences ?? {}),
  };

  return { email: authRes.data.user.email, prefs };
}

/** Send a "like" notification email if the user has it enabled. */
export async function sendLikeNotificationEmail(data: {
  recipientId: string;
  actorName: string;
  postTitle: string;
  postUrl: string;
}): Promise<void> {
  try {
    const userData = await getUserEmailData(data.recipientId);
    if (!userData?.email || !userData.prefs.likes) return;

    const { subject, html } = likeNotificationEmail({
      recipientName: "",
      actorName: data.actorName,
      postTitle: data.postTitle,
      postUrl: data.postUrl,
    });

    await sendEmail({ to: userData.email, subject, html });
  } catch {
    // Email failures are non-critical
  }
}

/** Send a "comment" notification email if the user has it enabled. */
export async function sendCommentNotificationEmail(data: {
  recipientId: string;
  actorName: string;
  commentPreview: string;
  postTitle: string;
  postUrl: string;
}): Promise<void> {
  try {
    const userData = await getUserEmailData(data.recipientId);
    if (!userData?.email || !userData.prefs.comments) return;

    const { subject, html } = commentNotificationEmail({
      recipientName: "",
      actorName: data.actorName,
      commentPreview: data.commentPreview,
      postTitle: data.postTitle,
      postUrl: data.postUrl,
    });

    await sendEmail({ to: userData.email, subject, html });
  } catch {
    // Email failures are non-critical
  }
}

/** Send a "follow" notification email if the user has it enabled. */
export async function sendFollowNotificationEmail(data: {
  recipientId: string;
  actorName: string;
  actorUsername: string;
  actorBio?: string;
}): Promise<void> {
  try {
    const userData = await getUserEmailData(data.recipientId);
    if (!userData?.email || !userData.prefs.follows) return;

    const { subject, html } = followNotificationEmail({
      recipientName: "",
      actorName: data.actorName,
      actorUsername: data.actorUsername,
      actorBio: data.actorBio,
    });

    await sendEmail({ to: userData.email, subject, html });
  } catch {
    // Email failures are non-critical
  }
}

/** Send a "level up" notification email if the user has it enabled. */
export async function sendLevelUpNotificationEmail(data: {
  recipientId: string;
  recipientName: string;
  newLevel: number;
  xpPoints: number;
}): Promise<void> {
  try {
    const userData = await getUserEmailData(data.recipientId);
    if (!userData?.email || !userData.prefs.level_up) return;

    const { subject, html } = levelUpNotificationEmail({
      recipientName: data.recipientName,
      newLevel: data.newLevel,
      xpPoints: data.xpPoints,
    });

    await sendEmail({ to: userData.email, subject, html });
  } catch {
    // Email failures are non-critical
  }
}

/** Update email notification preferences for the current user. */
export async function updateEmailNotificationPreferences(prefs: Partial<EmailNotificationPrefs>): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: current } = await supabase
      .from("profiles")
      .select("email_notification_preferences")
      .eq("id", user.id)
      .single();

    const merged = {
      ...DEFAULT_EMAIL_PREFS,
      ...(current?.email_notification_preferences ?? {}),
      ...prefs,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ email_notification_preferences: merged })
      .eq("id", user.id);

    if (error) return { error: error.message };
    return { success: true };
  } catch {
    return { error: "Not authenticated" };
  }
}

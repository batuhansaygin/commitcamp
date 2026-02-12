"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/lib/validations/messages";
import type { Message, Conversation } from "@/lib/types/messages";

// ── Helpers ──

interface ActionResult {
  error?: string;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Queries ──

/** Get all conversations for the current user (inbox view). */
export async function getConversations(): Promise<{
  data: Conversation[];
  error: string | null;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Get all messages involving this user, ordered by newest
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, read_at, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    if (!messages || messages.length === 0) return { data: [], error: null };

    // Group by the other user — keep only the latest message per conversation
    const conversationMap = new Map<string, Message>();
    for (const msg of messages) {
      const otherId =
        msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, msg as Message);
      }
    }

    // Fetch profiles for all conversation partners
    const otherIds = Array.from(conversationMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", otherIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    // Count unread messages per conversation
    const conversations: Conversation[] = [];
    for (const [otherId, lastMsg] of conversationMap) {
      const profile = profileMap.get(otherId);
      if (!profile) continue;

      // Count unread: messages from the other user that we haven't read
      const unreadCount = (messages as Message[]).filter(
        (m) =>
          m.sender_id === otherId &&
          m.receiver_id === user.id &&
          m.read_at === null
      ).length;

      conversations.push({
        user: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
        last_message: {
          content: lastMsg.content,
          created_at: lastMsg.created_at,
          is_own: lastMsg.sender_id === user.id,
        },
        unread_count: unreadCount,
      });
    }

    return { data: conversations, error: null };
  } catch {
    return { data: [], error: "Not authenticated" };
  }
}

/** Get the message thread between the current user and another user. */
export async function getThread(otherUsername: string): Promise<{
  data: Message[];
  otherUser: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  currentUserId: string | null;
  error: string | null;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Look up the other user by username
    const { data: otherProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("username", otherUsername)
      .single();

    if (profileError || !otherProfile) {
      return { data: [], otherUser: null, currentUserId: null, error: "User not found" };
    }

    // Fetch messages between the two users
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherProfile.id}),and(sender_id.eq.${otherProfile.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) return { data: [], otherUser: otherProfile, currentUserId: user.id, error: error.message };

    // Mark unread messages from the other user as read
    const unreadIds = (messages as Message[])
      .filter((m) => m.sender_id === otherProfile.id && m.read_at === null)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }

    return {
      data: messages as Message[],
      otherUser: otherProfile,
      currentUserId: user.id,
      error: null,
    };
  } catch {
    return { data: [], otherUser: null, currentUserId: null, error: "Not authenticated" };
  }
}

// ── Mutations ──

/** Send a message to another user. */
export async function sendMessage(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const content = formData.get("content");
  const receiverUsername = formData.get("receiver_username") as string;

  const parsed = sendMessageSchema.safeParse({ content });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Look up receiver
    const { data: receiver, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", receiverUsername)
      .single();

    if (profileError || !receiver) {
      return { error: "User not found." };
    }

    if (receiver.id === user.id) {
      return { error: "You cannot message yourself." };
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiver.id,
      content: parsed.data.content,
    });

    if (error) return { error: error.message };
  } catch {
    return { error: "You must be signed in to send messages." };
  }

  revalidatePath(`/messages/${receiverUsername}`);
  return {};
}

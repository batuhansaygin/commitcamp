"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types/notifications";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface NotificationInsertPayload {
  new: Notification;
}

export function useNotifications(
  userId: string | null,
  initialNotifications?: Notification[]
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications ?? []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!initialNotifications);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [{ data }, count] = await Promise.all([
        getNotifications(userId),
        getUnreadNotificationCount(),
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      throw err;
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    if (!initialNotifications) {
      setIsLoading(true);
      refresh()
        .catch((err) => {
          if (!(err instanceof Error && err.name === "AbortError")) {
            console.error("[useNotifications] refresh error:", err);
          }
        })
        .finally(() => { if (isMounted) setIsLoading(false); });
    } else {
      getUnreadNotificationCount()
        .then((count) => { if (isMounted) setUnreadCount(count); })
        .catch(() => {});
    }

    return () => { isMounted = false; };
  }, [userId, initialNotifications, refresh]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    channelRef.current = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: NotificationInsertPayload) => {
          const incoming = payload.new;
          setNotifications((prev) => [incoming, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch on any update to keep state in sync; fire-and-forget
          refresh().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(id);
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }, []);

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refresh };
}

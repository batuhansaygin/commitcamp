"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";
import { useUser } from "@/components/providers/user-provider";

export function NotificationBadge() {
  const { user } = useUser();
  const [count, setCount] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!user) return;
    getUnreadNotificationCount().then(setCount);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    channelRef.current = supabase
      .channel(`notifications-badge:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          getUnreadNotificationCount().then(setCount);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === null || count === 0) return null;

  return (
    <span
      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground"
      aria-label={`${count} unread notifications`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

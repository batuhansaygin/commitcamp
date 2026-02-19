"use client";

import { NotificationList } from "@/components/notifications/notification-list";
import { useNotifications } from "@/hooks/use-notifications";
import type { Notification, NotificationType } from "@/lib/types/notifications";

interface NotificationsPageClientProps {
  userId: string;
  initialNotifications: Notification[];
  typeFilter?: NotificationType;
}

export function NotificationsPageClient({
  userId,
  initialNotifications,
  typeFilter,
}: NotificationsPageClientProps) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(userId, initialNotifications);

  return (
    <NotificationList
      notifications={notifications}
      unreadCount={unreadCount}
      isLoading={isLoading}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      typeFilter={typeFilter}
    />
  );
}

"use client";

import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Bell } from "lucide-react";
import type { Notification, NotificationType } from "@/lib/types/notifications";

interface NotificationListProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  /** Filter by notification type (undefined = show all) */
  typeFilter?: NotificationType;
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function NotificationList({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  typeFilter,
}: NotificationListProps) {
  const t = useTranslations("notifications");

  const filtered = typeFilter
    ? notifications.filter((n) => n.type === typeFilter)
    : notifications;

  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Bell className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-sm">{t("empty")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("emptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mark all read banner */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {unreadCount} unread
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAllAsRead}
          >
            {t("markAllRead")}
          </Button>
        </div>
      )}

      <div className="divide-y divide-border">
        {filtered.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onRead={onMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
}

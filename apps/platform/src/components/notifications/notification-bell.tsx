"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotifications } from "@/hooks/use-notifications";
import { useUser } from "@/components/providers/user-provider";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

function NotificationBellInner({ userId }: { userId: string }) {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const recent = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${unreadCount} unread notifications`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground",
              "animate-in zoom-in-75 duration-200"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <h3 className="text-sm font-semibold">{t("title")}</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={markAllAsRead}
                >
                  {t("markAllRead")}
                </Button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t("empty")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border py-1">
                  {recent.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={markAsRead}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {t("viewAll")}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Renders the notification bell only when a user is authenticated. */
export function NotificationBell() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div className="h-9 w-9" />;
  if (!user) return null;
  return <NotificationBellInner userId={user.id} />;
}

"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/layout/notification-badge";
import { useUser } from "@/components/providers/user-provider";
import { Home, MessageSquare, Search, Bell, User } from "lucide-react";

interface NavTab {
  href: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  badge?: boolean;
}

const STATIC_TABS: NavTab[] = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/forum", icon: MessageSquare, label: "Forum" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/notifications", icon: Bell, label: "Alerts", badge: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useUser();

  const tabs: NavTab[] = [
    ...STATIC_TABS,
    ...(profile?.username
      ? [{ href: `/profile/${profile.username}`, icon: User, label: "Profile" }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-stretch border-t border-border bg-background/95 backdrop-blur-md md:hidden">
      {tabs.map(({ href, icon: Icon, label, badge }) => {
        const isActive =
          href === "/feed"
            ? pathname === "/feed"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "stroke-[2.5]"
                )}
              />
              {badge && (
                <span className="absolute -right-1.5 -top-1.5">
                  <NotificationBadge />
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[9px] font-medium leading-none",
                isActive && "font-semibold"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

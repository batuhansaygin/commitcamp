"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "@/components/layout/notification-badge";
import { LevelBadge } from "@/components/profile/level-badge";
import { useUser } from "@/components/providers/user-provider";
import { getPopularTags } from "@/lib/actions/search";
import {
  X,
  Home,
  FileCode,
  MessageCircle,
  BookMarked,
  User,
  Wrench,
  Trophy,
  Bell,
  Settings,
  TrendingUp,
  Award,
  Sparkles,
  Swords,
} from "lucide-react";
import { VersionBadge } from "@/components/ui/version-badge";

interface PlatformSidebarProps {
  open: boolean;
  onClose: () => void;
}

const STATIC_NAV: {
  href: string;
  icon: typeof Home;
  label: string;
  showBadge?: boolean;
}[] = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/snippets", icon: FileCode, label: "Snippets" },
  { href: "/forum", icon: MessageCircle, label: "Forum" },
  { href: "/challenges", icon: Swords, label: "Challenges" },
  { href: "/ai-assistant", icon: Sparkles, label: "AI Assistant" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/achievements", icon: Award, label: "Achievements" },
  { href: "/notifications", icon: Bell, label: "Notifications", showBadge: true },
  { href: "/messages", icon: BookMarked, label: "Messages" },
];

const MIN_TRENDING_TAGS = 3;

export function PlatformSidebar({ open, onClose }: PlatformSidebarProps) {
  const pathname = usePathname();
  const { profile: userProfile } = useUser();
  const [trendingTags, setTrendingTags] = useState<
    { tag: string; post_count: number }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    getPopularTags(5).then((tags) => {
      if (!cancelled) setTrendingTags(tags);
    });
    return () => { cancelled = true; };
  }, []);

  const allNav = [
    ...STATIC_NAV,
    ...(userProfile
      ? [
          {
            href: `/profile/${userProfile.username}`,
            icon: User,
            label: "Profile",
          },
        ]
      : []),
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-border bg-background transition-transform duration-300 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold gradient-text">CommitCamp</span>
            <VersionBadge />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {allNav.map((item) => {
            const isActive =
              item.href === "/feed"
                ? pathname === "/feed"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary ml-0 pl-[10px]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.showBadge && (
                  <span className="ml-auto">
                    <NotificationBadge />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Trending tags — only shown if >= MIN_TRENDING_TAGS */}
        {trendingTags.length >= MIN_TRENDING_TAGS && (
          <div className="border-t border-border/60 px-3 py-3">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Trending
              </span>
            </div>
            <div className="space-y-0.5">
              {trendingTags.map(({ tag, post_count }) => (
                <Link
                  key={tag}
                  href={`/search?tag=${encodeURIComponent(tag)}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <span className="truncate">#{tag}</span>
                  <span className="opacity-50 shrink-0 ml-2">{post_count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Developer Tools link */}
        <div className="border-t border-border/60 p-3">
          <Link
            href="/tools"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Wrench className="h-4 w-4" />
            Developer Tools
          </Link>
        </div>

        {/* User mini-profile card */}
        {userProfile && (
          <div className="border-t border-border/60 p-3">
            <Link
              href={`/profile/${userProfile.username}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border/60 px-3 py-2.5 hover:bg-muted/70 transition-colors group"
            >
              <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                <AvatarImage
                  src={userProfile.avatar_url ?? undefined}
                  alt={userProfile.username ?? ""}
                />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {(userProfile.display_name || userProfile.username || "?")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                  {userProfile.display_name || userProfile.username}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  @{userProfile.username}
                </p>
              </div>
              <LevelBadge level={userProfile.level} size="sm" />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

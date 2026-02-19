"use client";

import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/profile/level-badge";
import { markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, UserPlus, Star, Check, Trophy } from "lucide-react";
import type { Notification } from "@/lib/types/notifications";

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  /** Compact mode used inside the bell dropdown */
  compact?: boolean;
}

const TYPE_ICON = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  level_up: Star,
  achievement: Trophy,
} as const;

const TYPE_ICON_COLOR = {
  like: "text-rose-500",
  comment: "text-blue-500",
  follow: "text-green-500",
  level_up: "text-yellow-500",
  achievement: "text-amber-500",
} as const;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationItem({
  notification: n,
  onRead,
  compact = false,
}: NotificationItemProps) {
  const t = useTranslations("notifications");
  const Icon = TYPE_ICON[n.type] ?? Star;
  const iconColor = TYPE_ICON_COLOR[n.type] ?? "text-muted-foreground";

  const actorName = n.actor?.display_name || n.actor?.username || "Someone";
  const actorInitial = actorName.charAt(0).toUpperCase();

  const href =
    n.type === "follow"
      ? `/profile/${n.actor?.username}`
      : n.type === "level_up"
        ? "/settings"
        : n.type === "achievement"
          ? "/achievements"
          : n.post_id
            ? `/forum/${n.post_id}`
            : null;

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!n.is_read) {
      onRead?.(n.id);
      await markNotificationRead(n.id);
    }
  };

  const content = (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg px-3 transition-colors",
        compact ? "py-2" : "py-3",
        !n.is_read && "bg-primary/5 border-l-2 border-primary",
        n.is_read && "hover:bg-muted/50"
      )}
    >
      {/* Actor avatar or system icon */}
      <div className="relative shrink-0">
        {n.type === "level_up" || n.type === "achievement" ? (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              n.type === "achievement"
                ? "bg-amber-500/10"
                : "bg-yellow-500/10"
            )}
          >
            {n.type === "achievement" ? (
              <Trophy className="h-5 w-5 text-amber-500" />
            ) : (
              <Star className="h-5 w-5 text-yellow-500" />
            )}
          </div>
        ) : (
          <Avatar className="h-9 w-9">
            <AvatarImage src={n.actor?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-semibold">
              {actorInitial}
            </AvatarFallback>
          </Avatar>
        )}
        {/* Type indicator dot */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-1 ring-border",
          )}
        >
          <Icon className={cn("h-2.5 w-2.5", iconColor)} />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn("text-sm leading-snug", compact && "line-clamp-2")}>
          {n.type === "level_up" || n.type === "achievement" ? (
            <span
              className={n.type === "achievement" ? "font-medium" : undefined}
            >
              {n.message}
            </span>
          ) : (
            <>
              <span className="font-semibold">{actorName}</span>
              {n.actor?.level != null && (
                <LevelBadge level={n.actor.level} size="sm" className="ml-1" />
              )}
              <span className="text-muted-foreground"> {n.message}</span>
              {n.post?.title && (
                <span className="font-medium"> &ldquo;{n.post.title}&rdquo;</span>
              )}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
      </div>

      {/* Mark-as-read button */}
      {!n.is_read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleMarkRead}
          title={t("markRead")}
        >
          <Check className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} onClick={() => !n.is_read && onRead?.(n.id)}>
      {content}
    </Link>
  );
}

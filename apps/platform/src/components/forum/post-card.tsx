import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/lib/types/posts";
import { LevelBadge } from "@/components/profile/level-badge";
import { PostCardActions } from "@/components/forum/post-card-actions";

export type PostCardVariant = "grid" | "flow";

const CONTENT_PREVIEW_LENGTH = 140;

interface PostCardProps {
  snippet: PostWithAuthor;
  variant?: PostCardVariant;
  readMoreLabel?: string;
}

const TYPE_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  discussion: {
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  question: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  showcase: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PostCard({
  snippet: post,
  variant = "grid",
  readMoreLabel = "Read more",
}: PostCardProps) {
  const authorName =
    post.profiles?.display_name || post.profiles?.username || "Anonymous";
  const authorUsername = post.profiles?.username;
  const avatarUrl = post.profiles?.avatar_url;
  const level = post.profiles?.level ?? 1;
  const typeStyle = TYPE_COLORS[post.type] ?? TYPE_COLORS.discussion!;

  const plainContent = post.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const contentPreview =
    plainContent.length > CONTENT_PREVIEW_LENGTH
      ? plainContent.slice(0, CONTENT_PREVIEW_LENGTH).trim() + "…"
      : plainContent;

  const initial = authorName.charAt(0).toUpperCase();

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/60 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* ── Author row ────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            <AvatarImage src={avatarUrl ?? undefined} alt={authorName} />
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 flex-wrap">
            {authorUsername ? (
              <Link
                href={`/profile/${authorUsername}`}
                className="text-xs font-semibold text-foreground hover:text-primary truncate transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-xs font-semibold text-foreground truncate">
                {authorName}
              </span>
            )}
            <LevelBadge level={level} size="sm" />
          </div>

          <span className="shrink-0 text-[11px] text-muted-foreground">
            {timeAgo(post.created_at)}
          </span>
        </div>

        {/* ── Content (link to post) ─────────────────────────── */}
        <Link href={`/forum/${post.id}`} className="block space-y-2.5">
          {/* Type badge + solved */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                typeStyle.bg,
                typeStyle.text
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", typeStyle.dot)}
              />
              {post.type}
            </span>
            {post.type === "question" && post.is_solved && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Solved
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold leading-snug text-sm group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Content preview */}
          {variant !== "flow" && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {contentPreview}
            </p>
          )}
          {variant === "flow" && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
              {contentPreview}
              {plainContent.length > CONTENT_PREVIEW_LENGTH && (
                <span className="ml-1 font-medium text-primary">
                  {readMoreLabel}
                </span>
              )}
            </p>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* ── Action bar (like, comment, bookmark, share) ────── */}
        <PostCardActions postId={post.id} />
      </CardContent>
    </Card>
  );
}

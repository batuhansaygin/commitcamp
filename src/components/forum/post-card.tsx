import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/lib/types/posts";

export type PostCardVariant = "grid" | "flow";

interface PostCardProps {
  snippet: PostWithAuthor;
  variant?: PostCardVariant;
}

const TYPE_VARIANTS: Record<string, "default" | "info" | "warning"> = {
  discussion: "default",
  question: "info",
  showcase: "warning",
};

function timeAgo(dateStr: string): string {
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
}: PostCardProps) {
  const authorName =
    post.profiles?.display_name || post.profiles?.username || "Anonymous";
  const authorUsername = post.profiles?.username;
  const isFlow = variant === "flow";

  return (
    <Card
      className={cn(
        "group transition-colors hover:border-primary/30 hover:bg-muted/30",
        isFlow && "border-border"
      )}
    >
      <CardContent
        className={cn(
          "p-4 space-y-3",
          isFlow &&
            "flex flex-row flex-wrap items-center gap-x-3 gap-y-1 py-3 sm:flex-nowrap"
        )}
      >
        <Link
          href={`/forum/${post.id}`}
          className={cn(
            "block space-y-3",
            isFlow && "flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1"
          )}
        >
          {/* Type badge + solved indicator */}
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant={TYPE_VARIANTS[post.type] ?? "default"}
              className="text-[10px]"
            >
              {post.type}
            </Badge>
            {post.type === "question" && post.is_solved && (
              <Badge variant="success" className="text-[10px]">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Solved
              </Badge>
            )}
          </div>

          {/* Title + content + tags */}
          <div
            className={cn(
              "min-w-0 flex-1",
              isFlow ? "flex flex-wrap items-center gap-x-2 gap-y-0.5" : "space-y-1"
            )}
          >
            <h3
              className={cn(
                "font-semibold leading-snug group-hover:text-primary transition-colors",
                isFlow ? "text-sm line-clamp-1" : "text-sm line-clamp-2"
              )}
            >
              {post.title}
            </h3>
            {!isFlow && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {post.content}
              </p>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Footer: author (link to profile) + time */}
        <div
          className={cn(
            "flex items-center justify-between text-xs text-muted-foreground",
            isFlow && "w-full shrink-0 sm:w-auto sm:justify-end"
          )}
        >
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            {authorUsername ? (
              <Link
                href={`/profile/${authorUsername}`}
                className="truncate hover:text-primary hover:underline"
              >
                {authorName}
              </Link>
            ) : (
              <span className="truncate">{authorName}</span>
            )}
          </div>
          <span className="shrink-0">{timeAgo(post.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

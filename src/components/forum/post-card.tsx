import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MessageSquare, CheckCircle2 } from "lucide-react";
import type { PostWithAuthor } from "@/lib/types/posts";

interface PostCardProps {
  snippet: PostWithAuthor;
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

export function PostCard({ snippet: post }: PostCardProps) {
  const authorName =
    post.profiles?.display_name || post.profiles?.username || "Anonymous";

  return (
    <Link href={`/forum/${post.id}`}>
      <Card className="group transition-colors hover:border-primary/30 hover:bg-muted/30">
        <CardContent className="p-4 space-y-3">
          {/* Type badge + solved indicator */}
          <div className="flex items-center gap-2">
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

          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          {/* Content preview */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {post.content}
          </p>

          {/* Tags */}
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

          {/* Footer: author + time */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{authorName}</span>
            </div>
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

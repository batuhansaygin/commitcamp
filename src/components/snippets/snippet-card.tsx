import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, User } from "lucide-react";
import type { SnippetWithAuthor } from "@/lib/types/snippets";

interface SnippetCardProps {
  snippet: SnippetWithAuthor;
}

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

export function SnippetCard({ snippet }: SnippetCardProps) {
  const authorName =
    snippet.profiles?.display_name ||
    snippet.profiles?.username ||
    "Anonymous";

  return (
    <Link href={`/snippets/${snippet.id}`}>
      <Card className="group transition-colors hover:border-primary/30 hover:bg-muted/30">
        <CardContent className="p-4 space-y-3">
          {/* Title + language badge */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {snippet.title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {snippet.language}
            </Badge>
          </div>

          {/* Description */}
          {snippet.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {snippet.description}
            </p>
          )}

          {/* Code preview */}
          <div className="rounded-md bg-muted/50 border border-border px-3 py-2">
            <pre className="text-xs font-mono text-muted-foreground line-clamp-3 overflow-hidden">
              {snippet.code}
            </pre>
          </div>

          {/* Footer: author + time */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{authorName}</span>
            </div>
            <span>{timeAgo(snippet.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

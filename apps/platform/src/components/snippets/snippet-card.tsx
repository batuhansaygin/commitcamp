import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/profile/level-badge";
import { SnippetCardActions } from "@/components/snippets/snippet-card-actions";
import type { SnippetWithAuthor } from "@/lib/types/snippets";

const LANGUAGE_COLORS: Record<string, { bg: string; text: string }> = {
  typescript: { bg: "bg-blue-500/15", text: "text-blue-400" },
  javascript: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  python: { bg: "bg-green-500/15", text: "text-green-400" },
  go: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  rust: { bg: "bg-orange-500/15", text: "text-orange-400" },
  java: { bg: "bg-red-500/15", text: "text-red-400" },
  csharp: { bg: "bg-purple-500/15", text: "text-purple-400" },
  cpp: { bg: "bg-indigo-500/15", text: "text-indigo-400" },
  ruby: { bg: "bg-red-500/15", text: "text-red-400" },
  php: { bg: "bg-violet-500/15", text: "text-violet-400" },
  swift: { bg: "bg-orange-500/15", text: "text-orange-400" },
  kotlin: { bg: "bg-purple-500/15", text: "text-purple-400" },
  shell: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  css: { bg: "bg-pink-500/15", text: "text-pink-400" },
  html: { bg: "bg-orange-500/15", text: "text-orange-400" },
};

function getLangStyle(language: string) {
  const key = language.toLowerCase().replace(/[^a-z]/g, "");
  return LANGUAGE_COLORS[key] ?? { bg: "bg-zinc-500/15", text: "text-zinc-400" };
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

interface SnippetCardProps {
  snippet: SnippetWithAuthor;
}

const CODE_LINES_SHOWN = 8;

export function SnippetCard({ snippet }: SnippetCardProps) {
  const authorName =
    snippet.profiles?.display_name ||
    snippet.profiles?.username ||
    "Anonymous";
  const authorUsername = snippet.profiles?.username;
  const avatarUrl = snippet.profiles?.avatar_url;
  const level = snippet.profiles?.level ?? 1;
  const initial = authorName.charAt(0).toUpperCase();
  const langStyle = getLangStyle(snippet.language);

  const codeLines = snippet.code.split("\n");
  const preview = codeLines.slice(0, CODE_LINES_SHOWN).join("\n");
  const hasMore = codeLines.length > CODE_LINES_SHOWN;

  return (
    <Card className="group relative overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20">
      <CardContent className="p-4 space-y-3">
        {/* ── Author row ────────────────────────────────── */}
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
            {timeAgo(snippet.created_at)}
          </span>
        </div>

        {/* ── Main content (link) ────────────────────────── */}
        <Link href={`/snippets/${snippet.id}`} className="block space-y-3">
          {/* Title + language */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {snippet.title}
            </h3>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${langStyle.bg} ${langStyle.text}`}
            >
              {snippet.language}
            </span>
          </div>

          {/* Description */}
          {snippet.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
              {snippet.description}
            </p>
          )}

          {/* Code preview — always dark background */}
          <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 dark:bg-black/70 group/code">
            {/* Window chrome dots */}
            <div className="flex items-center gap-1.5 border-b border-zinc-800/80 bg-zinc-900/80 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-red-500/60" />
              <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
              <div className="h-2 w-2 rounded-full bg-green-500/60" />
              <span
                className={`ml-2 text-[9px] font-medium ${langStyle.text}`}
              >
                {snippet.language}
              </span>
            </div>

            {/* Code lines with numbers */}
            <div className="overflow-x-auto px-3 py-2.5">
              <pre className="text-[11px] leading-relaxed font-mono text-zinc-300">
                {preview.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="select-none w-5 shrink-0 text-right text-zinc-700 text-[10px]">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">{line || " "}</span>
                  </div>
                ))}
              </pre>
            </div>

            {hasMore && (
              <div className="border-t border-zinc-800/60 bg-zinc-900/60 px-4 py-1.5 text-center">
                <span className="text-[10px] text-zinc-500">
                  +{codeLines.length - CODE_LINES_SHOWN} more lines — View full snippet →
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* ── Action bar ────────────────────────────────── */}
        <SnippetCardActions snippetId={snippet.id} />
      </CardContent>
    </Card>
  );
}

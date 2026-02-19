import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Trophy } from "lucide-react";
import type { ChallengeLeaderboardEntry } from "@/lib/types/challenges";
import { LANGUAGE_LABELS, type SupportedLanguage } from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface Props {
  entries: ChallengeLeaderboardEntry[];
  currentUserId?: string;
}

function formatTime(ms: number): string {
  if (ms < 1000) return "< 1s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 > 0 ? `${m}m ${s % 60}s` : `${m}m`;
}

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; emoji: string }> = {
  1: { bg: "bg-yellow-500/12", border: "border-yellow-500/30", text: "text-yellow-500", emoji: "🥇" },
  2: { bg: "bg-slate-400/10",  border: "border-slate-400/25",  text: "text-slate-400",  emoji: "🥈" },
  3: { bg: "bg-amber-600/10",  border: "border-amber-600/25",  text: "text-amber-600",  emoji: "🥉" },
};

export function ChallengeLeaderboard({ entries, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Trophy className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium">No solutions yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Be the first to solve this challenge!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {entries.map((entry) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const rankStyle = RANK_STYLES[entry.rank];
        const langLabel = LANGUAGE_LABELS[entry.best_language as SupportedLanguage] ?? entry.best_language;

        return (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              isCurrentUser
                ? "bg-primary/6 border-l-[3px] border-l-primary"
                : "hover:bg-muted/40"
            )}
          >
            {/* Rank indicator */}
            <div className="w-8 flex items-center justify-center shrink-0">
              {rankStyle ? (
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full border text-sm",
                    rankStyle.bg,
                    rankStyle.border
                  )}
                >
                  {rankStyle.emoji}
                </span>
              ) : (
                <span className="text-sm font-bold text-muted-foreground tabular-nums w-7 text-center">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="w-8 h-8 shrink-0 ring-1 ring-border">
              {entry.avatar_url && <AvatarImage src={entry.avatar_url} alt={entry.display_name} />}
              <AvatarFallback className="text-xs bg-muted font-semibold">
                {entry.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn("text-sm font-semibold truncate", isCurrentUser && "text-primary")}>
                  {entry.display_name}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium"
                >
                  Lv.{entry.level}
                </Badge>
                {entry.rank === 1 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-500/12 text-red-500 border border-red-500/30 shrink-0">
                    First Blood 🩸
                  </Badge>
                )}
                {isCurrentUser && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/12 text-primary border border-primary/25 shrink-0">
                    You
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">@{entry.username}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 shrink-0">
              {entry.best_time_ms !== null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(entry.best_time_ms)}
                </span>
              )}
              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/60">
                {langLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

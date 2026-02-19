import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Medal, Zap, Clock } from "lucide-react";
import type { ChallengeLeaderboardEntry } from "@/lib/types/challenges";
import {
  LANGUAGE_LABELS,
  type SupportedLanguage,
} from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface Props {
  entries: ChallengeLeaderboardEntry[];
  currentUserId?: string;
}

function formatTime(ms: number): string {
  if (ms < 1000) return "< 1s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

const MEDAL_CONFIG: Record<
  number,
  { icon: string; color: string; bgClass: string }
> = {
  1: { icon: "🥇", color: "text-yellow-500", bgClass: "bg-yellow-500/10" },
  2: { icon: "🥈", color: "text-slate-400", bgClass: "bg-slate-400/10" },
  3: { icon: "🥉", color: "text-amber-600", bgClass: "bg-amber-600/10" },
};

export function ChallengeLeaderboard({ entries, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <Zap className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-medium">
          No solutions yet — be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {entries.map((entry) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const medal = MEDAL_CONFIG[entry.rank];
        const langLabel =
          LANGUAGE_LABELS[entry.best_language as SupportedLanguage] ??
          entry.best_language;

        return (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-colors",
              isCurrentUser
                ? "bg-primary/5 border-l-2 border-l-primary"
                : "hover:bg-muted/50"
            )}
          >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center shrink-0">
              {medal ? (
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-sm",
                    medal.bgClass
                  )}
                  title={`Rank #${entry.rank}`}
                >
                  {medal.icon}
                </span>
              ) : (
                <span className="text-sm font-semibold text-muted-foreground w-7 text-center">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar + user info */}
            <Avatar className="w-8 h-8 shrink-0">
              {entry.avatar_url && (
                <AvatarImage src={entry.avatar_url} alt={entry.display_name} />
              )}
              <AvatarFallback className="text-xs">
                {entry.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {entry.display_name}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                >
                  Lv.{entry.level}
                </Badge>
                {entry.rank === 1 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-500/15 text-red-500 border-red-500/30 border shrink-0">
                    First Blood 🩸
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                @{entry.username}
              </span>
            </div>

            {/* Time + language */}
            <div className="flex items-center gap-2 shrink-0">
              {entry.best_time_ms !== null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(entry.best_time_ms)}
                </span>
              )}
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/50">
                {langLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Swords, Zap, CheckCircle2, XCircle, Timer, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import type { Duel, DuelStatus } from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface DuelCardProps {
  duel: Duel;
  currentUserId?: string;
  onAccept?: (duelId: string) => void;
  onDecline?: (duelId: string) => void;
}

const STATUS_CONFIG: Record<DuelStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-amber-500/12 text-amber-500 border-amber-500/30" },
  active:    { label: "Active",    className: "bg-blue-500/12 text-blue-500 border-blue-500/30" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border/60" },
  expired:   { label: "Expired",   className: "bg-muted text-muted-foreground border-border/60" },
  declined:  { label: "Declined",  className: "bg-red-500/10 text-red-400 border-red-500/25" },
};

function formatTimeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatMs(ms: number | null) {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

interface PlayerProps {
  profile?: { display_name?: string | null; username?: string; avatar_url?: string | null } | null;
  time?: string;
  isYou?: boolean;
  isWinner?: boolean;
  align?: "left" | "right";
}

function Player({ profile, time, isYou, isWinner, align = "left" }: PlayerProps) {
  const name = profile?.display_name || profile?.username || "?";
  const isRight = align === "right";

  return (
    <div className={cn("flex items-center gap-2 flex-1 min-w-0", isRight && "flex-row-reverse")}>
      <Avatar className={cn("w-8 h-8 shrink-0 ring-2", isWinner ? "ring-green-500/50" : "ring-border")}>
        <AvatarImage src={profile?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs font-semibold bg-muted">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn("min-w-0", isRight && "text-right")}>
        <p className="text-xs font-semibold truncate">
          {name}
          {isYou && <span className="ml-1 text-[10px] text-primary font-normal">(you)</span>}
        </p>
        {time && <p className="text-[10px] text-muted-foreground font-mono">{time}</p>}
      </div>
    </div>
  );
}

export function DuelCard({ duel, currentUserId, onAccept, onDecline }: DuelCardProps) {
  const router = useRouter();
  const { label, className: statusClass } = STATUS_CONFIG[duel.status];
  const isChallenger = currentUserId === duel.challenger_id;
  const isOpponent   = currentUserId === duel.opponent_id;
  const isOpen       = duel.status === "pending" && !duel.opponent_id;
  const canAccept    = duel.status === "pending" && !isChallenger && !isOpen;
  const isWinner     = currentUserId === duel.winner_id;
  const isCompleted  = duel.status === "completed";
  const isActive     = duel.status === "active";

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        isActive && "border-blue-500/30 bg-blue-500/[0.02]"
      )}
    >
      <CardContent className="p-4 space-y-3.5">
        {/* Header: challenge info + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Swords className="w-3.5 h-3.5 text-primary" />
            </div>
            {duel.challenge ? (
              <button
                className="text-sm font-semibold hover:text-primary transition-colors text-left line-clamp-1 truncate"
                onClick={() => router.push(`/challenges/${duel.challenge!.slug}`)}
              >
                {duel.challenge.title}
              </button>
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">Unknown challenge</span>
            )}
            {duel.challenge && <DifficultyBadge difficulty={duel.challenge.difficulty} />}
          </div>
          <Badge className={cn("text-xs shrink-0 border", statusClass)}>{label}</Badge>
        </div>

        {/* Players VS row */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
          <Player
            profile={duel.challenger}
            time={isCompleted ? formatMs(duel.challenger_time_ms) : undefined}
            isYou={isChallenger}
            isWinner={isCompleted && duel.winner_id === duel.challenger_id}
          />
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-xs font-black text-muted-foreground/70 tracking-widest">VS</span>
          </div>
          {duel.opponent ? (
            <Player
              profile={duel.opponent}
              time={isCompleted ? formatMs(duel.opponent_time_ms) : undefined}
              isYou={isOpponent}
              isWinner={isCompleted && duel.winner_id === duel.opponent_id}
              align="right"
            />
          ) : (
            <div className="flex-1 flex justify-end">
              <span className="text-xs text-muted-foreground italic">Open challenge</span>
            </div>
          )}
        </div>

        {/* Footer: meta + actions */}
        <div className="flex items-center justify-between pt-0.5 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              {duel.xp_stake} XP
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {duel.time_limit_minutes}m
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(duel.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  isWinner ? "text-emerald-500" : "text-red-400"
                )}
              >
                {isWinner ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Won</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> Lost</>
                )}
              </span>
            )}
            {isActive && (isChallenger || isOpponent) && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => router.push(`/challenges/${duel.challenge?.slug}?duel=${duel.id}`)}
              >
                Continue
              </Button>
            )}
            {canAccept && onAccept && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/8"
                  onClick={() => onDecline?.(duel.id)}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => onAccept(duel.id)}
                >
                  Accept
                </Button>
              </>
            )}
            {isOpen && !isChallenger && (
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => router.push(`/challenges/${duel.challenge?.slug}?duel=${duel.id}`)}
              >
                Accept Duel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Swords, Clock, Zap, CheckCircle2, XCircle, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import type { Duel, DuelStatus } from "@/lib/types/challenges";

interface DuelCardProps {
  duel: Duel;
  currentUserId?: string;
  onAccept?: (duelId: string) => void;
  onDecline?: (duelId: string) => void;
}

const STATUS_CONFIG: Record<DuelStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  active: { label: "Active", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  completed: { label: "Completed", color: "bg-green-500/15 text-green-500 border-green-500/30" },
  expired: { label: "Expired", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  declined: { label: "Declined", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatMs(ms: number | null): string {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function DuelCard({ duel, currentUserId, onAccept, onDecline }: DuelCardProps) {
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[duel.status];
  const isChallenger = currentUserId === duel.challenger_id;
  const isOpponent = currentUserId === duel.opponent_id;
  const isOpen = duel.status === "pending" && !duel.opponent_id;
  const canAccept = duel.status === "pending" && !isChallenger && !isOpen;
  const isWinner = currentUserId === duel.winner_id;
  const isCompleted = duel.status === "completed";

  const challenger = duel.challenger;
  const opponent = duel.opponent;

  return (
    <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary shrink-0" />
            {duel.challenge && (
              <button
                className="font-semibold text-sm hover:underline text-left line-clamp-1"
                onClick={() => router.push(`/challenges/${duel.challenge!.slug}`)}
              >
                {duel.challenge.title}
              </button>
            )}
            {duel.challenge && <DifficultyBadge difficulty={duel.challenge.difficulty} />}
          </div>
          <Badge className={`text-xs shrink-0 ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Players row */}
        <div className="flex items-center gap-3">
          {/* Challenger */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={challenger?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {(challenger?.display_name || challenger?.username || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {challenger?.display_name || challenger?.username || "Unknown"}
                {isChallenger && (
                  <span className="ml-1 text-[10px] text-muted-foreground">(you)</span>
                )}
              </p>
              {isCompleted && (
                <p className="text-[10px] text-muted-foreground">
                  {formatMs(duel.challenger_time_ms)}
                </p>
              )}
            </div>
          </div>

          {/* VS divider */}
          <span className="text-xs font-bold text-muted-foreground shrink-0">VS</span>

          {/* Opponent */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            {opponent ? (
              <>
                <div className="min-w-0 text-right">
                  <p className="text-xs font-medium truncate">
                    {opponent.display_name || opponent.username}
                    {isOpponent && (
                      <span className="ml-1 text-[10px] text-muted-foreground">(you)</span>
                    )}
                  </p>
                  {isCompleted && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatMs(duel.opponent_time_ms)}
                    </p>
                  )}
                </div>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={opponent.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(opponent.display_name || opponent.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">Open challenge</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {duel.xp_stake} XP stake
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {duel.time_limit_minutes}min
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(duel.created_at)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <span className={`flex items-center gap-1 text-xs font-medium ${isWinner ? "text-green-500" : "text-red-400"}`}>
                {isWinner ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Won</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> Lost</>
                )}
              </span>
            )}
            {duel.status === "active" && (isChallenger || isOpponent) && (
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs"
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
                  className="h-7 px-2.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => onDecline?.(duel.id)}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => onAccept(duel.id)}
                >
                  Accept
                </Button>
              </>
            )}
            {isOpen && !isChallenger && (
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs"
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

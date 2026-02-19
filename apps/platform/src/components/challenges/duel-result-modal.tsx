"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Zap, Swords, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Duel } from "@/lib/types/challenges";

interface DuelResultModalProps {
  open: boolean;
  onClose: () => void;
  duel: Duel | null;
  currentUserId: string;
  onRematch?: () => void;
}

function formatTime(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function DuelResultModal({
  open,
  onClose,
  duel,
  currentUserId,
  onRematch,
}: DuelResultModalProps) {
  if (!duel) return null;

  const currentUserWon = duel.winner_id === currentUserId;
  const isDraw = duel.winner_id === null && duel.status === "completed";

  const currentIsChallenger = duel.challenger_id === currentUserId;
  const currentPlayer = currentIsChallenger ? duel.challenger : duel.opponent;
  const otherPlayer = currentIsChallenger ? duel.opponent : duel.challenger;
  const currentTime = currentIsChallenger ? duel.challenger_time_ms : duel.opponent_time_ms;
  const otherTime = currentIsChallenger ? duel.opponent_time_ms : duel.challenger_time_ms;

  const xpGained = currentUserWon
    ? duel.xp_stake + 50
    : isDraw
    ? duel.xp_stake
    : 10;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Duel Result</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Result announcement */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-2"
          >
            {isDraw ? (
              <>
                <Swords className="h-14 w-14 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground">Draw!</h2>
              </>
            ) : currentUserWon ? (
              <>
                <Trophy className="h-14 w-14 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                <h2 className="text-2xl font-bold text-amber-400">🏆 You Won!</h2>
              </>
            ) : (
              <>
                <Swords className="h-14 w-14 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground">You Lost</h2>
              </>
            )}

            <p className="text-sm text-muted-foreground">
              {duel.challenge?.title ?? "Challenge"}
            </p>
          </motion.div>

          {/* Players comparison */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Current user */}
              <PlayerCard
                username={currentPlayer?.username ?? "You"}
                displayName={currentPlayer?.display_name ?? "You"}
                solveTime={currentTime}
                isWinner={duel.winner_id === currentUserId}
                isCurrentUser
              />
              {/* Opponent */}
              <PlayerCard
                username={otherPlayer?.username ?? "Opponent"}
                displayName={otherPlayer?.display_name ?? "Opponent"}
                solveTime={otherTime}
                isWinner={
                  duel.winner_id !== null && duel.winner_id !== currentUserId
                }
              />
            </div>
          </motion.div>

          {/* XP earned */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">XP</span>
            <span className="font-bold text-amber-500">
              {currentUserWon || isDraw ? "+" : ""}
              {xpGained}
            </span>
            {currentUserWon && (
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 ml-1">
                {duel.xp_stake} stake + 50 bonus
              </Badge>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex gap-3 w-full"
          >
            {onRematch && (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={onRematch}
              >
                <RotateCcw className="h-4 w-4" />
                Rematch
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href="/challenges" onClick={onClose}>
                Back to Challenges
              </Link>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface PlayerCardProps {
  username: string;
  displayName: string;
  solveTime: number | null;
  isWinner: boolean;
  isCurrentUser?: boolean;
}

function PlayerCard({
  username,
  displayName,
  solveTime,
  isWinner,
  isCurrentUser = false,
}: PlayerCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors",
        isWinner
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-muted/20"
      )}
    >
      {isWinner && (
        <Trophy className="h-4 w-4 text-amber-400" />
      )}
      <div>
        <p className="text-sm font-semibold truncate max-w-[100px]">
          {displayName}
        </p>
        <p className="text-[11px] text-muted-foreground">@{username}</p>
        {isCurrentUser && (
          <Badge variant="secondary" className="text-[10px] mt-0.5">
            You
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className={cn("font-mono", isWinner && "text-amber-500 font-semibold")}>
          {formatTime(solveTime)}
        </span>
      </div>
    </div>
  );
}

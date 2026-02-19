"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Zap,
  Trophy,
  Clock,
  Code2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Submission } from "@/lib/types/challenges";
import {
  LANGUAGE_LABELS,
  type SupportedLanguage,
} from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  submission: Submission | null;
  xpEarned: number;
  isFirstSolve: boolean;
  newAchievements: string[];
  onViewLeaderboard: () => void;
  onNextChallenge: () => void;
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

const CONFETTI_COLORS = [
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
  "#eab308",
];

interface ConfettiDotProps {
  index: number;
}

function ConfettiDot({ index }: ConfettiDotProps) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = Math.random() * 8 + 4;
  const left = Math.random() * 100;
  const delay = Math.random() * 0.6;
  const duration = Math.random() * 1.5 + 1.5;
  const drift = (Math.random() - 0.5) * 200;

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${left}%`,
        top: "-10px",
        animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
        "--drift": `${drift}px`,
      } as React.CSSProperties}
    />
  );
}

export function SubmissionResultModal({
  open,
  onClose,
  submission,
  xpEarned,
  isFirstSolve,
  newAchievements,
  onViewLeaderboard,
  onNextChallenge,
}: Props) {
  const confettiContainerRef = useRef<HTMLDivElement>(null);

  const isPassed = submission?.status === "passed";
  const passRate = submission
    ? Math.round((submission.tests_passed / submission.tests_total) * 100)
    : 0;

  const langLabel = submission
    ? (LANGUAGE_LABELS[submission.language as SupportedLanguage] ??
      submission.language)
    : "";

  const baseXp = submission?.xp_earned ?? xpEarned;
  const speedBonus = xpEarned - baseXp > 0 ? xpEarned - baseXp : 0;

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) translateX(var(--drift)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <AnimatePresence mode="wait">
            {submission && (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    {isPassed ? "Challenge Solved!" : "Submission Result"}
                  </DialogTitle>
                </DialogHeader>

                {isPassed ? (
                  /* ── PASSED ─────────────────────────────────────────── */
                  <div className="space-y-5">
                    {/* Confetti */}
                    <div
                      ref={confettiContainerRef}
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      aria-hidden
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <ConfettiDot key={i} index={i} />
                      ))}
                    </div>

                    {/* Icon + heading */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: 0.1,
                        }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-xl font-bold"
                      >
                        🎉 Challenge Solved!
                      </motion.h2>
                    </div>

                    {/* Test results */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tests</span>
                        <span className="font-semibold text-green-500">
                          {submission.tests_passed}/{submission.tests_total} passed
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          Execution time
                        </span>
                        <span className="font-mono text-xs">
                          {formatTime(submission.execution_time_ms)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Code2 className="w-3.5 h-3.5" />
                          Language
                        </span>
                        <span className="font-mono text-xs">{langLabel}</span>
                      </div>
                    </motion.div>

                    {/* XP breakdown */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Base XP</span>
                        <span className="font-medium">+{baseXp} XP</span>
                      </div>
                      {speedBonus > 0 && (
                        <div className="flex items-center justify-between text-amber-500">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            Speed bonus
                          </span>
                          <span className="font-medium">+{speedBonus} XP</span>
                        </div>
                      )}
                      {isFirstSolve && (
                        <div className="flex items-center justify-between text-yellow-500">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            First solve!
                          </span>
                          <span className="font-medium">Bonus</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between font-bold border-t border-border/50 pt-2 mt-1">
                        <span>Total</span>
                        <span className="text-primary">
                          ✨ +{xpEarned} XP
                        </span>
                      </div>
                    </motion.div>

                    {/* New achievements */}
                    {newAchievements.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-1.5"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          New Achievements
                        </p>
                        {newAchievements.map((achievement) => (
                          <div
                            key={achievement}
                            className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm"
                          >
                            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>{achievement}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                      className="flex gap-2 pt-1"
                    >
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onViewLeaderboard}
                      >
                        View Leaderboard
                      </Button>
                      <Button className="flex-1" onClick={onNextChallenge}>
                        Next Challenge →
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  /* ── FAILED ──────────────────────────────────────────── */
                  <div className="space-y-5">
                    {/* Icon + heading */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: 0.1,
                        }}
                      >
                        <XCircle className="w-16 h-16 text-red-500" />
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold"
                      >
                        {submission.tests_passed}/{submission.tests_total} Tests Passed
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-muted-foreground"
                      >
                        Keep trying — you&apos;re almost there!
                      </motion.p>
                    </div>

                    {/* Progress bar */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Pass rate</span>
                        <span className="font-medium">{passRate}%</span>
                      </div>
                      <Progress
                        value={passRate}
                        className={cn(
                          "h-2",
                          passRate >= 50
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-red-500"
                        )}
                      />
                    </motion.div>

                    {/* Error details */}
                    {submission.error_message && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-mono text-red-600 dark:text-red-400 max-h-24 overflow-auto"
                      >
                        {submission.error_message}
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="flex gap-2 pt-1"
                    >
                      <Button
                        className="flex-1"
                        onClick={onClose}
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

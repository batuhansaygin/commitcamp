"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Zap,
  Trophy,
  Clock,
  Code2,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Submission } from "@/lib/types/challenges";
import { LANGUAGE_LABELS, type SupportedLanguage } from "@/lib/types/challenges";
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
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 > 0 ? `${m}m ${s % 60}s` : `${m}m`;
}

const CONFETTI_COLORS = [
  "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ef4444",
  "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1",
];

function ConfettiDot({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = Math.random() * 7 + 4;
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = Math.random() * 1.5 + 1.5;
  const drift = (Math.random() - 0.5) * 180;

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${left}%`,
        top: "-8px",
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
  const isPassed = submission?.status === "passed";
  const passRate = submission
    ? Math.round((submission.tests_passed / submission.tests_total) * 100)
    : 0;
  const langLabel = submission
    ? (LANGUAGE_LABELS[submission.language as SupportedLanguage] ?? submission.language)
    : "";
  const baseXp = submission?.xp_earned ?? xpEarned;
  const speedBonus = xpEarned - baseXp > 0 ? xpEarned - baseXp : 0;

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(380px) translateX(var(--drift)) rotate(700deg); opacity: 0; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[420px] overflow-hidden p-0">
          <AnimatePresence mode="wait">
            {submission && (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>{isPassed ? "Challenge Solved!" : "Submission Result"}</DialogTitle>
                </DialogHeader>

                {isPassed ? (
                  /* ── PASSED ─────────────────────────────────────────── */
                  <div>
                    {/* Confetti layer */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                      {Array.from({ length: 14 }).map((_, i) => (
                        <ConfettiDot key={i} index={i} />
                      ))}
                    </div>

                    {/* Hero banner */}
                    <div className="relative bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent px-6 pt-8 pb-6 text-center border-b border-green-500/20">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 ring-4 ring-green-500/30 mb-3"
                      >
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-2xl font-bold"
                      >
                        Challenge Solved!
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-sm text-muted-foreground mt-1"
                      >
                        {submission.tests_passed}/{submission.tests_total} tests passed
                      </motion.p>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-5 space-y-4">
                      {/* Run details */}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="rounded-lg bg-muted/50 px-3 py-2.5 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</p>
                            <p className="text-sm font-mono font-semibold">
                              {formatTime(submission.execution_time_ms)}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/50 px-3 py-2.5 flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Language</p>
                            <p className="text-sm font-semibold truncate">{langLabel}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* XP Earned */}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-xl border border-amber-500/25 bg-amber-500/6 p-4 space-y-2.5"
                      >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          XP Earned
                        </p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Base XP</span>
                            <span className="font-medium">+{baseXp}</span>
                          </div>
                          {speedBonus > 0 && (
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Speed bonus
                              </span>
                              <span className="font-medium">+{speedBonus}</span>
                            </div>
                          )}
                          {isFirstSolve && (
                            <div className="flex items-center justify-between text-yellow-600 dark:text-yellow-400">
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                First solve!
                              </span>
                              <span className="font-medium">Bonus</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between font-bold border-t border-amber-500/20 pt-2 text-base">
                          <span>Total</span>
                          <span className="text-amber-500">+{xpEarned} XP ✨</span>
                        </div>
                      </motion.div>

                      {/* New achievements */}
                      {newAchievements.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="space-y-2"
                        >
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            New Achievements
                          </p>
                          {newAchievements.map((a) => (
                            <div
                              key={a}
                              className="flex items-center gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-sm"
                            >
                              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="font-medium">{a}</span>
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
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={onViewLeaderboard}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Leaderboard
                        </Button>
                        <Button size="sm" className="flex-1 gap-1.5" onClick={onNextChallenge}>
                          Next
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  /* ── FAILED ──────────────────────────────────────────── */
                  <div>
                    {/* Hero banner */}
                    <div className="relative bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent px-6 pt-8 pb-6 text-center border-b border-red-500/20">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/15 ring-4 ring-red-500/20 mb-3"
                      >
                        <XCircle className="w-10 h-10 text-red-500" />
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 6 }}
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
                        className="text-sm text-muted-foreground mt-1"
                      >
                        Keep going — you&apos;re getting closer!
                      </motion.p>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                      {/* Progress bar */}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pass rate</span>
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              passRate >= 80 ? "text-amber-500" : passRate >= 50 ? "text-orange-500" : "text-red-500"
                            )}
                          >
                            {passRate}%
                          </span>
                        </div>
                        <Progress
                          value={passRate}
                          className={cn(
                            "h-2.5 rounded-full",
                            passRate >= 80
                              ? "[&>div]:bg-amber-500"
                              : passRate >= 50
                              ? "[&>div]:bg-orange-500"
                              : "[&>div]:bg-red-500"
                          )}
                        />
                      </motion.div>

                      {/* Error details */}
                      {submission.error_message && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="rounded-lg bg-red-500/8 border border-red-500/20 p-3"
                        >
                          <p className="text-xs font-semibold text-red-500 mb-1.5 uppercase tracking-wide">Error</p>
                          <pre className="text-xs font-mono text-red-600 dark:text-red-400 max-h-24 overflow-auto whitespace-pre-wrap break-words">
                            {submission.error_message}
                          </pre>
                        </motion.div>
                      )}

                      {/* Actions */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        className="flex gap-2 pt-1"
                      >
                        <Button variant="outline" className="flex-1" size="sm" onClick={onClose}>
                          Try Again
                        </Button>
                      </motion.div>
                    </div>
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

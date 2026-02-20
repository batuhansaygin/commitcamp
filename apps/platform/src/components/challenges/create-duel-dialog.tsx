"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Swords,
  Search,
  Zap,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { createDuel } from "@/lib/actions/challenges";
import { DifficultyBadge } from "./difficulty-badge";
import type { Challenge } from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface CreateDuelDialogProps {
  open: boolean;
  onClose: () => void;
  challenges: Challenge[];
}

const XP_STAKES = [25, 50, 100, 200];
const TIME_LIMITS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

export function CreateDuelDialog({ open, onClose, challenges }: CreateDuelDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [xpStake, setXpStake] = useState(50);
  const [timeLimit, setTimeLimit] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return challenges.slice(0, 20);
    return challenges
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.difficulty.includes(q) ||
          c.category.replace(/_/g, " ").includes(q)
      )
      .slice(0, 20);
  }, [challenges, search]);

  function handleClose() {
    if (isPending) return;
    setSearch("");
    setSelectedChallenge(null);
    setXpStake(50);
    setTimeLimit(30);
    setError(null);
    setSuccess(false);
    onClose();
  }

  function handleSubmit() {
    if (!selectedChallenge) return;
    setError(null);

    startTransition(async () => {
      const result = await createDuel(selectedChallenge.id, undefined, xpStake);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        router.refresh();
      }, 1200);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Swords className="w-4 h-4 text-primary" />
            </div>
            Create a Duel
          </DialogTitle>
          <DialogDescription>
            Pick a challenge, set your XP stake, and post an open duel — anyone can accept it!
          </DialogDescription>
        </DialogHeader>

        {success ? (
          /* ── Success state ─────────────────────────── */
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="font-semibold text-lg">Duel Created!</p>
            <p className="text-sm text-muted-foreground">
              Your open duel is live. Anyone can accept the challenge!
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* ── Step 1: Challenge picker ────────────── */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                1. Choose a challenge
              </p>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search challenges…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedChallenge(null);
                  }}
                  className="pl-9 h-9 text-sm"
                  autoComplete="off"
                />
              </div>

              {/* Challenge list */}
              {!selectedChallenge ? (
                <div className="rounded-lg border border-border overflow-hidden max-h-52 overflow-y-auto divide-y divide-border/50">
                  {filtered.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No challenges found
                    </div>
                  ) : (
                    filtered.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors group"
                        onClick={() => setSelectedChallenge(c)}
                      >
                        <DifficultyBadge difficulty={c.difficulty} />
                        <span className="flex-1 text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {c.title}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {c.xp_reward}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Selected challenge preview */
                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                  <DifficultyBadge difficulty={selectedChallenge.difficulty} />
                  <span className="flex-1 text-sm font-semibold truncate">
                    {selectedChallenge.title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                    <Zap className="w-3 h-3" />
                    {selectedChallenge.xp_reward} XP
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors ml-1"
                    onClick={() => setSelectedChallenge(null)}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* ── Step 2: XP Stake ────────────────────── */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">2. XP Stake</p>
              <p className="text-xs text-muted-foreground">
                Winner takes the stake from the loser. Choose wisely.
              </p>
              <div className="flex items-center gap-2">
                {XP_STAKES.map((xp) => (
                  <button
                    key={xp}
                    type="button"
                    onClick={() => setXpStake(xp)}
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-sm font-semibold transition-all",
                      xpStake === xp
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                    {xp}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Step 3: Time Limit ──────────────────── */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">3. Time Limit</p>
              <div className="flex items-center gap-2">
                {TIME_LIMITS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeLimit(value)}
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-sm font-semibold transition-all",
                      timeLimit === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/8 border border-red-500/25 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary + Submit */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
              <div className="text-xs text-muted-foreground space-y-0.5">
                {selectedChallenge ? (
                  <>
                    <p className="font-medium text-foreground">
                      Open duel — {selectedChallenge.title}
                    </p>
                    <p>
                      Stake: <span className="text-amber-500 font-semibold">{xpStake} XP</span>
                      {" · "}
                      Limit: <span className="font-semibold">{timeLimit}m</span>
                    </p>
                  </>
                ) : (
                  <p>Select a challenge to continue</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!selectedChallenge || isPending}
                  className="gap-1.5 min-w-28"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Swords className="w-3.5 h-3.5" />
                      Post Duel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

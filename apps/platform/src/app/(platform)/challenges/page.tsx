import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getChallenges,
  getDailyChallenge,
  getChallengeUserStats,
  getContests,
} from "@/lib/actions/challenges";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { DailyChallengeCard } from "@/components/challenges/daily-challenge-card";
import { ContestCard } from "@/components/challenges/contest-card";
import { ChallengeRankBadge } from "@/components/challenges/challenge-rank-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Swords,
  Trophy,
  Flame,
  Plus,
  Shuffle,
  Target,
  Zap,
  TrendingUp,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Metadata } from "next";
import type { ChallengeDifficulty, ChallengeCategory } from "@/lib/types/challenges";
import { CATEGORY_CONFIG } from "@/lib/types/challenges";

export const metadata: Metadata = {
  title: "Coding Challenges — CommitCamp",
  description: "Sharpen your skills with algorithmic challenges, 1v1 duels, and contests.",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const DIFFICULTIES: { value: ChallengeDifficulty | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "" },
  { value: "easy", label: "Easy", color: "text-green-500" },
  { value: "medium", label: "Medium", color: "text-amber-500" },
  { value: "hard", label: "Hard", color: "text-red-500" },
  { value: "expert", label: "Expert", color: "text-purple-500" },
];

const PAGE_SIZE = 12;

export default async function ChallengesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const difficulty =
    params.difficulty && params.difficulty !== "all"
      ? (params.difficulty as ChallengeDifficulty)
      : undefined;
  const category = params.category as ChallengeCategory | undefined;
  const search = params.search || undefined;
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const [{ challenges, total }, daily, stats, allContests] = await Promise.all([
    getChallenges({ difficulty, category, search, page, limit: PAGE_SIZE }),
    getDailyChallenge(),
    getChallengeUserStats(),
    getContests("active"),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = {
      difficulty: params.difficulty,
      category: params.category,
      search: params.search,
      page: params.page,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") next.set(k, v);
    }
    return `/challenges?${next.toString()}`;
  }

  const activeDiff = params.difficulty || "all";
  const hasFilters = !!(search || difficulty || category);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Swords className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Coding Challenges</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sharpen your skills. Earn XP. Climb the ranks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/challenges/duels">
              <Swords className="w-4 h-4" />
              Duels
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/challenges/contests">
              <Trophy className="w-4 h-4" />
              Contests
            </Link>
          </Button>
          <Button size="sm" asChild className="gap-1.5">
            <Link href="/challenges/create">
              <Plus className="w-4 h-4" />
              Create Challenge
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Solved */}
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/20">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_solved ?? 0}</p>
              <p className="text-xs text-muted-foreground">Solved</p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/20">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.current_streak ?? 0}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </CardContent>
        </Card>

        {/* Rank */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <ChallengeRankBadge
                rank={stats?.challenge_rank ?? "unranked"}
                totalSolved={stats?.total_solved ?? 0}
              />
              <p className="text-xs text-muted-foreground mt-0.5">Rank</p>
            </div>
          </CardContent>
        </Card>

        {/* Duels */}
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/20">
              <Swords className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                <span className="text-green-500">{stats?.duel_wins ?? 0}</span>
                <span className="text-muted-foreground/60 text-base font-normal mx-1">/</span>
                <span className="text-red-500">{stats?.duel_losses ?? 0}</span>
              </p>
              <p className="text-xs text-muted-foreground">W / L Duels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Challenge ──────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-semibold">Today&apos;s Challenge</h2>
        </div>
        {daily ? (
          <DailyChallengeCard
            challenge={daily}
            userSolved={daily.user_solved}
            streak={stats?.current_streak}
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-3xl mb-2">🌅</p>
              <p className="font-medium">No daily challenge today</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back tomorrow for a fresh challenge!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Active Contests ──────────────────────────────────────── */}
      {allContests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-semibold">Active Contests</h2>
              <Badge className="bg-green-500/12 text-green-500 border-green-500/30 text-xs gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Live
              </Badge>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
              <Link href="/challenges/contests">
                View all
                <TrendingUp className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {allContests.slice(0, 2).map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Challenges ───────────────────────────────────────── */}
      <section className="space-y-5">
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold">All Challenges</h2>
            {total > 0 && (
              <Badge variant="secondary" className="text-xs tabular-nums">
                {total.toLocaleString()}
              </Badge>
            )}
          </div>
          {challenges.length > 0 && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link
                href={`/challenges/${
                  challenges[Math.floor(Math.random() * challenges.length)]?.slug ?? ""
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Random
              </Link>
            </Button>
          )}
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
          {/* Difficulty pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {DIFFICULTIES.map(({ value, label, color }) => {
              const isActive =
                value === "all" ? !params.difficulty || params.difficulty === "all" : activeDiff === value;
              return (
                <Link key={value} href={buildUrl({ difficulty: value, page: "1" })}>
                  <button
                    className={[
                      "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : `bg-background border border-border hover:border-primary/40 hover:bg-primary/5 ${color || "text-muted-foreground hover:text-foreground"}`,
                    ].join(" ")}
                  >
                    {label}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Category + search row */}
          <form method="get" action="/challenges" className="flex items-center gap-2 flex-wrap">
            {difficulty && <input type="hidden" name="difficulty" value={difficulty} />}
            {search && <input type="hidden" name="search" value={search} />}

            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                name="category"
                defaultValue={category ?? ""}
                className="h-9 appearance-none rounded-lg border border-border bg-background pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 cursor-pointer"
              >
                <option value="">All Categories</option>
                {(
                  Object.entries(CATEGORY_CONFIG) as [
                    ChallengeCategory,
                    { label: string; icon: string }
                  ][]
                ).map(([val, { label, icon }]) => (
                  <option key={val} value={val}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search challenges…"
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>

            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Filter
            </button>

            {hasFilters && (
              <Link
                href="/challenges"
                className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors flex items-center"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Challenge grid */}
        {challenges.length > 0 ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
                  {page > 1 ? (
                    <Link href={buildUrl({ page: String(page - 1) })}>← Prev</Link>
                  ) : (
                    <span>← Prev</span>
                  )}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <Link key={p} href={buildUrl({ page: String(p) })}>
                        <button
                          className={[
                            "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
                            p === page
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          ].join(" ")}
                        >
                          {p}
                        </button>
                      </Link>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <Link href={buildUrl({ page: String(page + 1) })}>Next →</Link>
                  ) : (
                    <span>Next →</span>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-14 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-lg">No challenges found</p>
              <p className="text-sm text-muted-foreground mt-1.5 mb-5">
                {hasFilters
                  ? "Try adjusting your filters or search term."
                  : "Be the first to create a challenge!"}
              </p>
              {hasFilters ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/challenges">Clear filters</Link>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/challenges/create">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Challenge
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

import { Suspense } from "react";
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
  BarChart3,
  TrendingUp,
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

const DIFFICULTIES: { value: ChallengeDifficulty | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most_solved", label: "Most Solved" },
  { value: "hardest", label: "Hardest First" },
  { value: "easiest", label: "Easiest First" },
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

  // Parallel data fetch
  const [{ challenges, total }, daily, stats, allContests] = await Promise.all([
    getChallenges({ difficulty, category, search, page, limit: PAGE_SIZE }),
    getDailyChallenge(),
    getChallengeUserStats(),
    getContests("active"),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build pagination URLs
  function buildUrl(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = { difficulty: params.difficulty, category: params.category, search: params.search, page: params.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") next.set(k, v);
    }
    return `/challenges?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">⚔️ Coding Challenges</h1>
              <p className="text-sm text-muted-foreground">
                Sharpen your skills. Earn XP. Climb the ranks.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/challenges/duels">
              <Swords className="w-4 h-4 mr-1.5" />
              Duels
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/challenges/contests">
              <Trophy className="w-4 h-4 mr-1.5" />
              Contests
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/challenges/create">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Challenge
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Target className="w-4.5 h-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats?.total_solved ?? 0}</p>
              <p className="text-xs text-muted-foreground">Solved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold">
                🔥 {stats?.current_streak ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="mt-0.5">
                <ChallengeRankBadge
                  rank={stats?.challenge_rank ?? "unranked"}
                  totalSolved={stats?.total_solved ?? 0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Rank</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Swords className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {stats?.duel_wins ?? 0}W / {stats?.duel_losses ?? 0}L
              </p>
              <p className="text-xs text-muted-foreground">Duels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Challenge ────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4.5 h-4.5 text-orange-500" />
          <h2 className="text-base font-semibold">Today&apos;s Challenge</h2>
        </div>
        {daily ? (
          <DailyChallengeCard challenge={daily} userSolved={daily.user_solved} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-2xl mb-2">🌅</p>
              <p className="font-medium">No daily challenge today</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back tomorrow for a fresh challenge!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Active Contests ────────────────────────────────────── */}
      {allContests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4.5 h-4.5 text-amber-500" />
              <h2 className="text-base font-semibold">🏆 Active Contests</h2>
              <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs">
                Live
              </Badge>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/challenges/contests">
                View all <TrendingUp className="w-3.5 h-3.5 ml-1" />
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

      {/* ── Challenge List ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4.5 h-4.5 text-primary" />
            <h2 className="text-base font-semibold">All Challenges</h2>
            {total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {total.toLocaleString()} {total === 1 ? "challenge" : "challenges"}
              </Badge>
            )}
          </div>
          {/* Random challenge */}
          {challenges.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/challenges/${
                  challenges[Math.floor(Math.random() * challenges.length)]?.slug ?? ""
                }`}
              >
                <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                Random
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Difficulty tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {DIFFICULTIES.map(({ value, label }) => {
              const isActive =
                value === "all"
                  ? !params.difficulty || params.difficulty === "all"
                  : params.difficulty === value;
              return (
                <Link key={value} href={buildUrl({ difficulty: value, page: "1" })}>
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                  >
                    {label}
                  </Badge>
                </Link>
              );
            })}
          </div>

          {/* Category + Sort + Search row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category select — native HTML for server component */}
            <form method="get" action="/challenges" className="contents">
              {difficulty && (
                <input type="hidden" name="difficulty" value={difficulty} />
              )}
              {search && <input type="hidden" name="search" value={search} />}
              <select
                name="category"
                defaultValue={category ?? ""}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onChangeCapture={undefined}
              >
                <option value="">All Categories</option>
                {(Object.entries(CATEGORY_CONFIG) as [ChallengeCategory, { label: string; icon: string }][]).map(
                  ([val, { label, icon }]) => (
                    <option key={val} value={val}>
                      {icon} {label}
                    </option>
                  )
                )}
              </select>

              <input
                type="text"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search challenges…"
                className="h-9 flex-1 min-w-40 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Filter
              </button>
            </form>
          </div>
        </div>

        {/* Grid */}
        {challenges.length > 0 ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={buildUrl({ page: String(page - 1) })}>← Prev</Link>
                  ) : (
                    <span>← Prev</span>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
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
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-lg">No challenges found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {search || difficulty || category
                  ? "Try adjusting your filters or search term."
                  : "Be the first to create a challenge!"}
              </p>
              {(search || difficulty || category) && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/challenges">Clear filters</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContests } from "@/lib/actions/challenges";
import { ContestCard } from "@/components/challenges/contest-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import type { Contest } from "@/lib/types/challenges";

export const metadata: Metadata = {
  title: "Contests — CommitCamp",
  description: "Compete in timed coding contests and win XP prizes.",
};

export default async function ContestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allContests = await getContests();

  const upcoming = allContests.filter((c) => c.status === "upcoming");
  const active = allContests.filter((c) => c.status === "active");
  const ended = allContests.filter((c) => c.status === "ended").slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* ── Back + Header ─────────────────────────────────────── */}
      <div className="space-y-4">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Challenges
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contests</h1>
            <p className="text-sm text-muted-foreground">
              Compete in timed events, earn XP prizes, and make the leaderboard.
            </p>
          </div>
        </div>
      </div>

      {/* ── Active Contests ────────────────────────────────────── */}
      {active.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold">Active Contests</h2>
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs animate-pulse">
              Live
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((contest) => (
              <ContestCard key={contest.id} contest={contest} showJoinButton />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming Contests ──────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold">Upcoming Contests</h2>
            <Badge variant="secondary" className="text-xs">
              {upcoming.length}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((contest) => (
              <ContestCard key={contest.id} contest={contest} showJoinButton />
            ))}
          </div>
        </section>
      )}

      {/* ── Past Contests ─────────────────────────────────────── */}
      {ended.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Past Contests</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ended.map((contest) => (
              <ContestCard key={contest.id} contest={contest} showJoinButton={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {allContests.length === 0 && (
        <Card>
          <CardContent className="p-16 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-semibold text-lg">No contests yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contests are coming soon. Stay tuned!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

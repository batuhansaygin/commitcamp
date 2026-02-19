import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveDuels, getDuelHistory, getChallengeUserStats } from "@/lib/actions/challenges";
import { DuelCard } from "@/components/challenges/duel-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Swords, ChevronLeft, TrendingUp, Trophy, Target } from "lucide-react";
import type { Metadata } from "next";
import type { Duel } from "@/lib/types/challenges";

export const metadata: Metadata = {
  title: "Duels — CommitCamp",
  description: "Challenge other developers to 1v1 coding duels and prove your skills.",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function DuelsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [activeDuels, history, stats] = await Promise.all([
    getActiveDuels(),
    getDuelHistory(),
    getChallengeUserStats(),
  ]);

  // Split active duels: open (no opponent) vs targeted
  const openDuels = activeDuels.filter(
    (d) => d.status === "pending" && !d.opponent_id
  );
  const myActiveDuels = activeDuels.filter(
    (d) => !(d.status === "pending" && !d.opponent_id)
  );

  const totalDuels = (stats?.duel_wins ?? 0) + (stats?.duel_losses ?? 0);
  const winRate =
    totalDuels > 0
      ? Math.round(((stats?.duel_wins ?? 0) / totalDuels) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      {/* ── Back + Header ─────────────────────────────────────── */}
      <div className="space-y-4">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Challenges
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">⚔️ Duels</h1>
              <p className="text-sm text-muted-foreground">
                1v1 coding battles — fastest correct solution wins
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/challenges?duel=1">
              <Swords className="w-4 h-4 mr-1.5" />
              Create Duel
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{stats?.duel_wins ?? 0}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold">{stats?.duel_losses ?? 0}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-1.5">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win rate</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1 gap-1.5">
            Active
            {myActiveDuels.length > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 bg-primary text-primary-foreground">
                {myActiveDuels.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="open" className="flex-1 gap-1.5">
            Open Duels
            {openDuels.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {openDuels.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            History
          </TabsTrigger>
        </TabsList>

        {/* Active Duels */}
        <TabsContent value="active" className="mt-4 space-y-3">
          {myActiveDuels.length > 0 ? (
            myActiveDuels.map((duel) => (
              <DuelCard
                key={duel.id}
                duel={duel}
                currentUserId={user.id}
              />
            ))
          ) : (
            <EmptyDuels
              title="No active duels"
              description="Challenge someone to a duel or accept an open challenge!"
              cta="Find a challenge"
              href="/challenges?duel=1"
            />
          )}
        </TabsContent>

        {/* Open Duels (anyone can join) */}
        <TabsContent value="open" className="mt-4 space-y-3">
          {openDuels.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                These are open challenges — anyone can accept them!
              </p>
              {openDuels.map((duel) => (
                <DuelCard
                  key={duel.id}
                  duel={duel}
                  currentUserId={user.id}
                />
              ))}
            </>
          ) : (
            <EmptyDuels
              title="No open duels"
              description="No open challenges at the moment. Create one and see who accepts!"
              cta="Create a duel"
              href="/challenges?duel=1"
            />
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length > 0 ? (
            history.map((duel) => (
              <DuelCard
                key={duel.id}
                duel={duel}
                currentUserId={user.id}
              />
            ))
          ) : (
            <EmptyDuels
              title="No duel history"
              description="You haven't completed any duels yet. Challenge someone to get started!"
              cta="Challenge someone"
              href="/challenges?duel=1"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyDuels({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <Card>
      <CardContent className="p-10 text-center">
        <p className="text-3xl mb-3">⚔️</p>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
        <Button size="sm" asChild>
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

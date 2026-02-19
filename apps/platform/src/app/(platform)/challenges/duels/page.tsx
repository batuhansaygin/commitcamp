import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveDuels,
  getDuelHistory,
  getChallengeUserStats,
  getChallenges,
} from "@/lib/actions/challenges";
import { DuelsHeader } from "@/components/challenges/duels-header";
import { DuelsClient } from "@/components/challenges/duels-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Swords, ChevronLeft, Trophy, Target, BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duels — CommitCamp",
  description: "Challenge other developers to 1v1 coding duels and prove your skills.",
};

export default async function DuelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [activeDuels, history, stats, { challenges }] = await Promise.all([
    getActiveDuels(),
    getDuelHistory(),
    getChallengeUserStats(),
    getChallenges({ limit: 100 }),
  ]);

  // Open duels: pending with no opponent (anyone can join)
  const openDuels = activeDuels.filter(
    (d) => d.status === "pending" && !d.opponent_id
  );
  // My targeted active duels
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Duels</h1>
              <p className="text-sm text-muted-foreground">
                1v1 coding battles — fastest correct solution wins
              </p>
            </div>
          </div>
          {/* Client component opens the create dialog */}
          <DuelsHeader challenges={challenges} />
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.duel_wins ?? 0}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/20">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.duel_losses ?? 0}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/20">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Win rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <Tabs defaultValue={myActiveDuels.length > 0 ? "active" : openDuels.length > 0 ? "open" : "active"}>
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

        {/* Active Duels (targeted / in-progress) */}
        <TabsContent value="active" className="mt-4 space-y-3">
          {myActiveDuels.length > 0 ? (
            <DuelsClient duels={myActiveDuels} currentUserId={user.id} />
          ) : (
            <EmptyDuels
              title="No active duels"
              description="Create a duel or accept an open challenge to get started!"
              icon="active"
            />
          )}
        </TabsContent>

        {/* Open Duels (anyone can accept) */}
        <TabsContent value="open" className="mt-4 space-y-3">
          {openDuels.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground px-0.5">
                Open challenges — anyone can accept and compete!
              </p>
              <DuelsClient duels={openDuels} currentUserId={user.id} />
            </>
          ) : (
            <EmptyDuels
              title="No open duels"
              description="No open challenges at the moment. Create one and see who accepts!"
              icon="open"
            />
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length > 0 ? (
            <DuelsClient duels={history} currentUserId={user.id} />
          ) : (
            <EmptyDuels
              title="No duel history"
              description="You haven't completed any duels yet. Challenge someone now!"
              icon="history"
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
  icon,
}: {
  title: string;
  description: string;
  icon: "active" | "open" | "history";
}) {
  const emojis = { active: "⚔️", open: "🏆", history: "📜" };
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Swords className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
      </CardContent>
    </Card>
  );
}

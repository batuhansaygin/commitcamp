import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getContests, getContestLeaderboard, joinContest } from "@/lib/actions/challenges";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  Zap,
  Medal,
  CheckCircle2,
} from "lucide-react";
import type { Metadata } from "next";
import type { Challenge, Contest, ContestStatus } from "@/lib/types/challenges";

const STATUS_CONFIG: Record<ContestStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  active: { label: "Live", color: "bg-green-500/15 text-green-500 border-green-500/30" },
  ended: { label: "Ended", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startsAt: string, endsAt: string): string {
  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  // Fetch minimally for metadata
  const contests = await getContests();
  const contest = contests.find((c) => c.id === id);
  if (!contest) return { title: "Contest Not Found" };
  return {
    title: `${contest.title} — CommitCamp`,
    description: contest.description ?? "Join this coding contest on CommitCamp.",
  };
}

export default async function ContestDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  // Fetch contest + leaderboard in parallel
  const [allContests, leaderboard] = await Promise.all([
    getContests(),
    getContestLeaderboard(id),
  ]);

  const contest = allContests.find((c) => c.id === id);
  if (!contest) notFound();

  const statusConfig = STATUS_CONFIG[contest.status];
  const isJoinable = contest.status === "upcoming" || contest.status === "active";
  const isParticipating = leaderboard.some((p) => p.user_id === user.id);

  // Fetch challenges in this contest by IDs
  let contestChallenges: Challenge[] = [];
  if (contest.challenge_ids.length > 0) {
    const { data } = await supabase
      .from("challenges")
      .select("*, author:profiles(username,display_name,avatar_url,level)")
      .in("id", contest.challenge_ids)
      .eq("status", "published");

    contestChallenges = (data ?? []) as Challenge[];

    // Mark which user has solved
    if (contestChallenges.length > 0) {
      const ids = contestChallenges.map((c) => c.id);
      const { data: solves } = await supabase
        .from("challenge_solves")
        .select("challenge_id")
        .eq("user_id", user.id)
        .in("challenge_id", ids);
      const solvedSet = new Set((solves ?? []).map((s) => s.challenge_id));
      contestChallenges.forEach((c) => {
        c.user_solved = solvedSet.has(c.id);
      });
    }
  }

  const solvedCount = contestChallenges.filter((c) => c.user_solved).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* ── Back ──────────────────────────────────────────────── */}
      <Link
        href="/challenges/contests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Contests
      </Link>

      {/* ── Contest Header ────────────────────────────────────── */}
      <Card
        className={
          contest.status === "active"
            ? "border-green-500/30 bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5"
            : ""
        }
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs ${statusConfig.color}`}>
                  {statusConfig.label}
                </Badge>
                {isParticipating && (
                  <Badge className="text-xs bg-primary/15 text-primary border-primary/30 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Joined
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{contest.title}</h1>
              {contest.description && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {contest.description}
                </p>
              )}
            </div>

            {isJoinable && !isParticipating && (
              <form
                action={async () => {
                  "use server";
                  await joinContest(id);
                }}
              >
                <Button type="submit" size="sm">
                  <Trophy className="w-4 h-4 mr-1.5" />
                  Join Contest
                </Button>
              </form>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-5 flex-wrap text-sm text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Starts: {formatDateTime(contest.starts_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Ends: {formatDateTime(contest.ends_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Duration: {formatDuration(contest.starts_at, contest.ends_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {contest.participants_count.toLocaleString()} participants
            </span>
          </div>

          {/* XP prizes */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Prizes:</span>
            {[
              { label: "🥇 1st", xp: contest.xp_first_place },
              { label: "🥈 2nd", xp: contest.xp_second_place },
              { label: "🥉 3rd", xp: contest.xp_third_place },
              { label: "Top 10", xp: contest.xp_top_10 },
              { label: "Participation", xp: contest.xp_participation },
            ].map(({ label, xp }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-muted border border-border/50"
              >
                {label}
                <Zap className="w-3 h-3 text-amber-500" />
                {xp.toLocaleString()} XP
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Challenge List ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-primary" />
            <h2 className="font-semibold">
              Challenges
            </h2>
            <Badge variant="secondary" className="text-xs">
              {contestChallenges.length}
            </Badge>
            {isParticipating && contestChallenges.length > 0 && (
              <Badge className="text-xs bg-green-500/15 text-green-500 border-green-500/30 ml-auto">
                {solvedCount}/{contestChallenges.length} solved
              </Badge>
            )}
          </div>

          {contestChallenges.length > 0 ? (
            <div className="grid gap-3">
              {contestChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-2xl mb-2">🔜</p>
                <p className="text-sm text-muted-foreground">
                  Challenges will be revealed when the contest starts.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Leaderboard ───────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Medal className="w-4.5 h-4.5 text-amber-500" />
            <h2 className="font-semibold">Leaderboard</h2>
            {leaderboard.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {leaderboard.length}
              </Badge>
            )}
          </div>

          <Card>
            {leaderboard.length > 0 ? (
              <div className="divide-y divide-border/50">
                {leaderboard.slice(0, 20).map((participant, index) => {
                  const rank = participant.rank ?? index + 1;
                  const isMe = participant.user_id === user.id;
                  const medal = RANK_MEDALS[rank - 1];
                  const profile = participant.profile;

                  return (
                    <div
                      key={participant.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        isMe ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Rank */}
                      <span className="w-6 text-center text-sm font-semibold shrink-0">
                        {medal ?? rank}
                      </span>

                      {/* Avatar */}
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(
                            profile?.display_name ||
                            profile?.username ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/profile/${profile?.username ?? ""}`}
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {profile?.display_name || profile?.username || "Unknown"}
                          {isMe && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          {participant.challenges_solved} solved
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{participant.score}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          {participant.xp_earned}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <CardContent className="p-8 text-center">
                <p className="text-2xl mb-2">🏁</p>
                <p className="text-sm text-muted-foreground">
                  {contest.status === "upcoming"
                    ? "Leaderboard will appear when the contest starts."
                    : "No participants yet. Be the first!"}
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

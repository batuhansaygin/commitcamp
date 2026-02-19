import { setRequestLocale } from "@/lib/i18n-server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/profile/level-badge";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import { getLevelTier } from "@/lib/xp";
import { Trophy, Star, FileText, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { LeaderboardPeriod, LeaderboardCategory } from "@/lib/actions/leaderboard";
import type { LeaderboardEntry } from "@/lib/types/xp";

export const metadata: Metadata = { title: "Leaderboard" };

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string; category?: string }>;
}

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const CATEGORIES: {
  value: LeaderboardCategory;
  label: string;
  icon: typeof Star;
}[] = [
  { value: "xp", label: "Overall XP", icon: Star },
  { value: "posts", label: "Most Posts", icon: FileText },
  { value: "likes", label: "Most Liked", icon: Heart },
];

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const PODIUM_SIZES = [
  /* #1 */ "ring-2 ring-yellow-400/50 h-16 w-16",
  /* #2 */ "ring-1 ring-zinc-400/40 h-13 w-13",
  /* #3 */ "ring-1 ring-amber-700/40 h-13 w-13",
];

function formatScore(score: number, category: LeaderboardCategory): string {
  if (category === "xp") return `${score.toLocaleString("en-US")} XP`;
  if (category === "posts") return `${score.toLocaleString("en-US")} posts`;
  return `${score.toLocaleString("en-US")} likes`;
}

function TopThreeCard({
  entry,
  rank,
  category,
  isFirst,
}: {
  entry: LeaderboardEntry;
  rank: number;
  category: LeaderboardCategory;
  isFirst?: boolean;
}) {
  const idx = rank - 1;
  const medalColor = MEDAL_COLORS[idx] ?? "#94a3b8";
  const { color: tierColor } = getLevelTier(entry.level);
  const initial = (entry.display_name || entry.username).charAt(0).toUpperCase();
  const avatarSize = isFirst ? "h-16 w-16" : "h-12 w-12";

  return (
    <Link href={`/profile/${entry.username}`} className="block group">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
          isFirst && "ring-1 ring-yellow-400/30 shadow-yellow-500/5 shadow-lg"
        )}
      >
        <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
          {/* Medal emoji badge */}
          <span className="text-2xl">{MEDAL_EMOJIS[idx]}</span>

          {/* Avatar */}
          <Avatar
            className={cn(avatarSize, "ring-2 ring-offset-2 ring-offset-card")}
            style={{ ["--tw-ring-color" as string]: `${medalColor}60` }}
          >
            <AvatarImage
              src={entry.avatar_url ?? undefined}
              alt={entry.username}
            />
            <AvatarFallback
              className="font-bold text-base"
              style={{
                backgroundColor: `${tierColor}22`,
                color: tierColor,
              }}
            >
              {initial}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <div className="space-y-0.5 w-full">
            <p className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
              {entry.display_name || entry.username}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              @{entry.username}
            </p>
          </div>

          <LevelBadge level={entry.level} size="sm" />

          {/* Score */}
          <p
            className={cn(
              "text-sm font-bold",
              isFirst ? "text-base" : "text-sm"
            )}
            style={{ color: medalColor }}
          >
            {formatScore(entry.period_score, category)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function RankedRow({
  entry,
  rank,
  category,
}: {
  entry: LeaderboardEntry;
  rank: number;
  category: LeaderboardCategory;
}) {
  const initial = (entry.display_name || entry.username).charAt(0).toUpperCase();
  const { color: tierColor } = getLevelTier(entry.level);

  return (
    <Link
      href={`/profile/${entry.username}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 group"
    >
      <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {rank}
      </span>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={entry.avatar_url ?? undefined} alt={entry.username} />
        <AvatarFallback
          className="text-xs font-bold"
          style={{ backgroundColor: `${tierColor}22`, color: tierColor }}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium truncate group-hover:text-primary transition-colors">
            {entry.display_name || entry.username}
          </span>
          <LevelBadge level={entry.level} size="sm" />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          @{entry.username}
        </p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">
        {formatScore(entry.period_score, category)}
      </span>
    </Link>
  );
}

export default async function LeaderboardPage({
  params,
  searchParams,
}: PageProps) {
  const { period: rawPeriod, category: rawCategory } = await searchParams;

  const period: LeaderboardPeriod =
    rawPeriod === "week" || rawPeriod === "month" || rawPeriod === "all"
      ? rawPeriod
      : "all";

  const category: LeaderboardCategory =
    rawCategory === "xp" || rawCategory === "posts" || rawCategory === "likes"
      ? rawCategory
      : "xp";

  const { data: entries } = await getLeaderboard(period, category, 50);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder for Olympic podium: 2nd (left) | 1st (center) | 3rd (right)
  const podiumOrder =
    top3.length === 3
      ? [top3[1]!, top3[0]!, top3[2]!]
      : top3.length === 2
      ? [top3[1]!, top3[0]!]
      : top3;
  const podiumRanks =
    top3.length === 3 ? [2, 1, 3] : top3.length === 2 ? [2, 1] : [1];

  return (
    <div className="mx-auto max-w-2xl w-full space-y-6">
      {/* Header — left-aligned, no back button */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Top developers ranked by XP, posts, and reactions
        </p>
      </div>

      {/* Period filter */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/leaderboard?period=${p.value}&category=${category}`}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors",
              period === p.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.value}
              href={`/leaderboard?period=${period}&category=${c.value}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === c.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {c.label}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-sm">No data yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start creating posts and earning XP to appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top 3 podium — Olympic order: 2nd | 1st | 3rd */}
          {top3.length > 0 && (
            <div
              className={cn(
                "grid gap-3",
                top3.length === 1
                  ? "grid-cols-1 max-w-xs mx-auto"
                  : top3.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              )}
            >
              {podiumOrder.map((entry, i) => {
                const rank = podiumRanks[i] ?? i + 1;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex flex-col",
                      rank === 1 && top3.length === 3 && "mt-0",
                      rank === 2 && top3.length === 3 && "mt-4",
                      rank === 3 && top3.length === 3 && "mt-6"
                    )}
                  >
                    <TopThreeCard
                      entry={entry}
                      rank={rank}
                      category={category}
                      isFirst={rank === 1}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 0-XP notice */}
          {top3.length > 0 &&
            top3.every((e) => e.period_score === 0) && (
              <p className="text-center text-xs text-muted-foreground border border-border/60 rounded-lg py-2.5 px-4 bg-muted/30">
                No XP earned yet this period. Start posting to climb the ranks!
              </p>
            )}

          {/* Ranked list 4th+ */}
          {rest.length > 0 && (
            <Card>
              <CardContent className="p-2 divide-y divide-border/60">
                {rest.map((entry, idx) => (
                  <RankedRow
                    key={entry.id}
                    entry={entry}
                    rank={idx + 4}
                    category={category}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

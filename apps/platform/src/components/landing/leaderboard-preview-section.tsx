"use client";

import { useTranslations } from "@/lib/i18n";
import { FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "./motion-wrappers";
import { getLevelTier } from "@/lib/xp";
import { LevelBadge } from "@/components/profile/level-badge";
import { Trophy, Medal } from "lucide-react";

const FAKE_LEADERBOARD = [
  { rank: 1, name: "Elena Rodriguez", username: "elena_dev", level: 52, xp: 15420, avatarColor: "from-violet-500 to-purple-600" },
  { rank: 2, name: "Marcus Chen", username: "mchen", level: 48, xp: 14100, avatarColor: "from-cyan-500 to-blue-500" },
  { rank: 3, name: "Sarah Kim", username: "sarahkim", level: 45, xp: 13500, avatarColor: "from-pink-500 to-rose-500" },
  { rank: 4, name: "Alex Thompson", username: "athompson", level: 42, xp: 12200, avatarColor: "from-amber-500 to-orange-500" },
  { rank: 5, name: "Priya Patel", username: "priyap", level: 38, xp: 11800, avatarColor: "from-emerald-500 to-teal-500" },
];

const TIERS = [
  { level: 3, label: "Bronze" },
  { level: 8, label: "Silver" },
  { level: 15, label: "Gold" },
  { level: 28, label: "Platinum" },
  { level: 42, label: "Diamond" },
  { level: 52, label: "Legendary" },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
      {rank}
    </span>
  );
}

function LeaderboardTable() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-5 py-3">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-semibold">Global Leaderboard</span>
        <span className="ml-auto text-xs text-muted-foreground">Top Developers</span>
      </div>

      {/* Rows */}
      <StaggerContainer className="divide-y divide-border/40">
        {FAKE_LEADERBOARD.map((user) => (
          <StaggerItem key={user.rank}>
            <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              {/* Rank */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <RankIcon rank={user.rank} />
              </div>

              {/* Avatar */}
              <div
                className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-sm text-white font-bold shadow-md`}
              >
                {user.name[0]}
              </div>

              {/* Name / username */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>

              {/* Level badge */}
              <LevelBadge level={user.level} size="sm" />

              {/* XP */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground">{user.xp.toLocaleString("en-US")}</p>
                <p className="text-[9px] text-muted-foreground">XP</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Footer */}
      <div className="border-t border-border/40 bg-muted/30 px-5 py-2.5 text-center text-xs text-muted-foreground">
        And thousands more...
      </div>
    </div>
  );
}

export function LeaderboardPreviewSection() {
  const t = useTranslations("landing.leaderboard");

  return (
    <section id="leaderboard" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Leaderboard */}
          <FadeInLeft>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 blur-2xl rounded-3xl pointer-events-none" />
              <LeaderboardTable />
            </div>
          </FadeInLeft>

          {/* Right: Text */}
          <FadeInRight delay={0.1}>
            <span className="text-sm font-semibold text-amber-500 uppercase tracking-widest">
              {t("label")}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("description")}
            </p>

            {/* Tier progression */}
            <div className="mt-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Tier System
              </p>
              <div className="flex flex-wrap gap-2">
                {TIERS.map(({ level, label }) => (
                  <LevelBadge key={label} level={level} size="md" />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Every contribution earns XP — posts, comments, follows, and more.
              </p>
            </div>

            {/* XP progress bar example */}
            <div className="mt-6 rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">Your Progress</span>
                </div>
                <LevelBadge level={24} size="sm" />
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm" />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">6,500 XP</span>
                <span className="text-[10px] text-muted-foreground">10,000 XP to next tier</span>
              </div>
            </div>
          </FadeInRight>
        </div>
      </div>
    </section>
  );
}

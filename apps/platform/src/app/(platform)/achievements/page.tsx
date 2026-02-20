import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getUserAchievementProgress,
  getAchievementStats,
} from "@/lib/actions/achievements";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { StreakCounter } from "@/components/achievements/streak-counter";
import { RarityBadge } from "@/components/achievements/rarity-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Target, Flame } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ namespace: "achievements" });
  return {
    title: `${t("title")} — CommitCamp`,
    description: t("description"),
  };
}

export default async function AchievementsPage({ params }: PageProps) {
  const t = await getTranslations("achievements");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login`);

  const [progress, stats] = await Promise.all([
    getUserAchievementProgress(user.id),
    getAchievementStats(user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
      </div>

      {/* ── Stats cards ─────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total unlocked */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {stats.total_unlocked}
                <span className="text-sm font-normal text-muted-foreground">
                  /{stats.total_available}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{t("stats.unlocked")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/20">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-orange-500">
                {stats.current_streak}
              </p>
              <p className="text-xs text-muted-foreground">{t("stats.streak")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Rarest badge */}
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20 text-xl">
              {stats.rarest_unlocked ? stats.rarest_unlocked.icon : "✨"}
            </div>
            <div>
              {stats.rarest_unlocked ? (
                <RarityBadge rarity={stats.rarest_unlocked.rarity} />
              ) : (
                <p className="text-sm font-medium text-muted-foreground">—</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t("stats.rarest")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Completion */}
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-emerald-500">
                {stats.completion_percent}%
              </p>
              <p className="text-xs text-muted-foreground">{t("stats.completion")}</p>
              <Progress value={stats.completion_percent} className="h-1 mt-1.5 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Streak + longest ───────────────────────────────── */}
      {stats.current_streak > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <StreakCounter
            streak={stats.current_streak}
            longestStreak={stats.longest_streak}
            size="lg"
          />
          {stats.longest_streak > stats.current_streak && (
            <span className="text-sm text-muted-foreground">
              Personal best:{" "}
              <span className="font-semibold text-foreground">
                {stats.longest_streak}d
              </span>
            </span>
          )}
        </div>
      )}

      {/* ── Achievement grid ────────────────────────────────── */}
      <AchievementGrid progress={progress} />
    </div>
  );
}

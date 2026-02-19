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
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {t("stats.unlocked")}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {stats.total_unlocked}
              <span className="text-sm font-normal text-muted-foreground">
                /{stats.total_available}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">
                {t("stats.streak")}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-400">
              {stats.current_streak}
            </p>
          </CardContent>
        </Card>

        {/* Rarest badge */}
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base leading-none">✨</span>
              <span className="text-xs font-medium text-muted-foreground">
                {t("stats.rarest")}
              </span>
            </div>
            {stats.rarest_unlocked ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xl">{stats.rarest_unlocked.icon}</span>
                <RarityBadge rarity={stats.rarest_unlocked.rarity} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">—</p>
            )}
          </CardContent>
        </Card>

        {/* Completion */}
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">
                {t("stats.completion")}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
              {stats.completion_percent}%
            </p>
            <Progress
              value={stats.completion_percent}
              className="h-1 mt-2"
            />
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

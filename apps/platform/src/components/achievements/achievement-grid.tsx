"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
} from "@/lib/types/achievements";
import type {
  AchievementProgress,
  AchievementCategory,
} from "@/lib/types/achievements";

interface AchievementGridProps {
  progress: AchievementProgress[];
}

export function AchievementGrid({ progress }: AchievementGridProps) {
  const t = useTranslations("achievements");
  const [activeCategory, setActiveCategory] = useState<
    AchievementCategory | "all"
  >("all");

  const categories = useMemo<(AchievementCategory | "all")[]>(
    () => ["all", ...CATEGORY_ORDER],
    []
  );

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? progress
        : progress.filter((p) => p.category === activeCategory),
    [progress, activeCategory]
  );

  // Group by category for "all" view
  const grouped = useMemo(() => {
    if (activeCategory !== "all") return null;
    const map = new Map<AchievementCategory, AchievementProgress[]>();
    for (const p of progress) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, [progress, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Category filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const count =
            cat === "all"
              ? progress.filter((p) => p.is_unlocked).length
              : progress.filter(
                  (p) => p.category === cat && p.is_unlocked
                ).length;
          const total =
            cat === "all"
              ? progress.length
              : progress.filter((p) => p.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat === "all" ? t("categories.all") : CATEGORY_LABELS[cat]}
              <span
                className={cn(
                  "rounded-full px-1 py-0.5 text-[9px] font-bold",
                  activeCategory === cat
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/60 text-muted-foreground"
                )}
              >
                {count}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Achievements display */}
      {activeCategory === "all" && grouped ? (
        // Grouped by category
        <div className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {CATEGORY_LABELS[cat]}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {items.filter((i) => i.is_unlocked).length}/{items.length}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Unlocked first */}
                  {[
                    ...items.filter((i) => i.is_unlocked).sort((a, b) =>
                      (b.unlocked_at ?? "").localeCompare(a.unlocked_at ?? "")
                    ),
                    ...items.filter((i) => !i.is_unlocked),
                  ].map((p) => (
                    <AchievementCard key={p.id} progress={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat filtered grid
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            ...filtered.filter((p) => p.is_unlocked).sort((a, b) =>
              (b.unlocked_at ?? "").localeCompare(a.unlocked_at ?? "")
            ),
            ...filtered.filter((p) => !p.is_unlocked),
          ].map((p) => (
            <AchievementCard key={p.id} progress={p} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <span className="text-4xl">🔒</span>
          <p className="font-medium text-sm">{t("noAchievements")}</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {t("noAchievementsDescription")}
          </p>
        </div>
      )}
    </div>
  );
}

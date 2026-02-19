"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RARITY_CONFIG } from "@/lib/types/achievements";
import { cn } from "@/lib/utils";
import { X, Sparkles } from "lucide-react";

interface AchievementToast {
  id: string;
  icon: string;
  name: string;
  description: string;
  rarity: string;
  xp_reward: number;
}

interface AchievementUnlockToastProps {
  userId: string | null;
}

const TOAST_DURATION = 5000; // ms

export function AchievementUnlockToast({ userId }: AchievementUnlockToastProps) {
  const [queue, setQueue] = useState<AchievementToast[]>([]);
  const [current, setCurrent] = useState<AchievementToast | null>(null);

  const advance = useCallback(() => {
    setCurrent(null);
    setTimeout(() => {
      setQueue((q) => {
        const [next, ...rest] = q;
        if (next) setCurrent(next);
        return rest;
      });
    }, 400);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next ?? null);
      setQueue(rest);
    }
  }, [queue, current]);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(advance, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [current, advance]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`achievements-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const achievementId = (payload.new as { achievement_id: string })
            .achievement_id;
          // Fetch achievement details
          const { data } = await supabase
            .from("achievements")
            .select("id, name, description, icon, rarity, xp_reward")
            .eq("id", achievementId)
            .single();
          if (data) {
            setQueue((q) => [...q, data as AchievementToast]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!current) return null;

  const rarityKey = current.rarity as keyof typeof RARITY_CONFIG;
  const config = RARITY_CONFIG[rarityKey] ?? RARITY_CONFIG.common;
  const isSpecial =
    current.rarity === "epic" || current.rarity === "legendary";

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-[9999] md:bottom-6",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      <div
        className={cn(
          "relative flex items-start gap-3 rounded-2xl border p-4 shadow-2xl max-w-xs",
          config.bgClass,
          config.borderClass,
          isSpecial && "ring-2 ring-offset-2 ring-offset-background",
          current.rarity === "legendary" && "ring-amber-400",
          current.rarity === "epic" && "ring-purple-400"
        )}
      >
        {/* Sparkle accent for epic/legendary */}
        {isSpecial && (
          <Sparkles
            className={cn(
              "absolute -top-2 -left-2 h-5 w-5",
              current.rarity === "legendary"
                ? "text-amber-400"
                : "text-purple-400"
            )}
          />
        )}

        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl",
            config.bgClass,
            config.borderClass
          )}
        >
          {current.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Achievement Unlocked!
          </p>
          <p className={cn("font-bold text-sm", config.textClass)}>
            {current.name}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {current.description}
          </p>
          {current.xp_reward > 0 && (
            <p className={cn("text-xs font-semibold mt-0.5", config.textClass)}>
              +{current.xp_reward} XP
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={advance}
          className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Progress bar */}
        <div
          className={cn(
            "absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-b-2xl transition-all",
            config.textClass.replace("text-", "bg-")
          )}
          style={{
            animation: `shrink ${TOAST_DURATION}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

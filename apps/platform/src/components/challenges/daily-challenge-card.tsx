"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Zap, ChevronRight, Star, Trophy, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import { CategoryBadge } from "./category-badge";
import type { Challenge } from "@/lib/types/challenges";

interface DailyChallengeCardProps {
  challenge: Challenge;
  userSolved?: boolean;
  streak?: number;
}

export function DailyChallengeCard({ challenge, userSolved, streak }: DailyChallengeCardProps) {
  const router = useRouter();

  return (
    <Card
      className="relative overflow-hidden border-orange-500/40 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 hover:border-orange-500/60"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--card)) 0%, rgba(249,115,22,0.04) 50%, hsl(var(--card)) 100%)",
      }}
      onClick={() => router.push(`/challenges/${challenge.slug}`)}
    >
      {/* Subtle glow orbs */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-orange-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-500/6 blur-2xl" />

      <CardContent className="relative p-6 space-y-4">
        {/* Top row: badges + solved indicator */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/40 gap-1.5 text-xs font-semibold px-2.5">
                <Flame className="w-3 h-3" />
                Daily Challenge
              </Badge>
              <DifficultyBadge difficulty={challenge.difficulty} />
              <CategoryBadge category={challenge.category} />
            </div>
            <h2 className="text-xl font-bold leading-snug">{challenge.title}</h2>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {userSolved ? (
              <Badge className="bg-green-500/15 text-green-500 border-green-500/40 gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Solved
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 gap-1.5 text-xs">
                <Trophy className="w-3 h-3" />
                +30 Bonus XP
              </Badge>
            )}
            {(streak ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <Flame className="w-3.5 h-3.5" />
                {streak}-day streak
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {challenge.description.replace(/#{1,6}\s|```[\s\S]*?```|\*\*|\*/g, "").slice(0, 140)}
        </p>

        {/* Stats + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-amber-500 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              +{challenge.xp_reward} XP
            </span>
            {challenge.xp_first_solve_bonus > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="w-3.5 h-3.5" />
                +{challenge.xp_first_solve_bonus} first
              </span>
            )}
          </div>

          <Button
            size="sm"
            className="gap-1.5 shadow-sm"
            style={
              userSolved
                ? undefined
                : {
                    background: "linear-gradient(135deg, #f97316, #f59e0b)",
                    border: "none",
                    color: "white",
                  }
            }
            variant={userSolved ? "outline" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/challenges/${challenge.slug}`);
            }}
          >
            {userSolved ? "View Solution" : "Solve Now"}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

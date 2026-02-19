"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Zap, ChevronRight, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import { CategoryBadge } from "./category-badge";
import type { Challenge } from "@/lib/types/challenges";

interface DailyChallengeCardProps {
  challenge: Challenge;
  userSolved?: boolean;
}

export function DailyChallengeCard({ challenge, userSolved }: DailyChallengeCardProps) {
  const router = useRouter();

  return (
    <Card
      className="relative overflow-hidden border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-background to-amber-500/5 shadow-orange-500/10 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => router.push(`/challenges/${challenge.slug}`)}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />

      <CardContent className="p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 gap-1 text-xs">
                <Flame className="w-3 h-3" />
                Daily Challenge
              </Badge>
              <DifficultyBadge difficulty={challenge.difficulty} />
              <CategoryBadge category={challenge.category} />
            </div>
            <h2 className="text-xl font-bold leading-snug">{challenge.title}</h2>
          </div>

          {userSolved && (
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 shrink-0">
              ✓ Solved
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {challenge.description}
        </p>

        {/* Stats + CTA */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              +{challenge.xp_reward} XP
            </span>
            {challenge.xp_first_solve_bonus > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5" />
                +{challenge.xp_first_solve_bonus} first solve
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {challenge.time_limit_ms / 1000}s limit
            </span>
          </div>

          <Button
            size="sm"
            className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
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

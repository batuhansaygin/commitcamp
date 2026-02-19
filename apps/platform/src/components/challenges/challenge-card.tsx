"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle2, Clock, Users, Zap, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import { CategoryBadge } from "./category-badge";
import { LANGUAGE_LABELS, type Challenge, type SupportedLanguage } from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: Challenge;
}

function formatTime(ms: number): string {
  if (ms < 1000) return "< 1s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 > 0 ? `${m}m ${s % 60}s` : `${m}m`;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const router = useRouter();
  const displayLangs = challenge.supported_languages.slice(0, 2);
  const extraCount = challenge.supported_languages.length - 2;
  const getLangLabel = (l: string) => LANGUAGE_LABELS[l as SupportedLanguage] ?? l;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/30",
        challenge.user_solved
          ? "border-green-500/40 bg-green-500/[0.02] shadow-green-500/5 shadow-sm"
          : "hover:bg-accent/20"
      )}
      onClick={() => router.push(`/challenges/${challenge.slug}`)}
    >
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Header: difficulty + title + category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyBadge difficulty={challenge.difficulty} />
              {challenge.user_solved && (
                <Badge
                  variant="outline"
                  className="text-xs text-green-500 border-green-500/40 bg-green-500/8 gap-1 py-0"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Solved
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {challenge.title}
            </h3>
          </div>
          <CategoryBadge category={challenge.category} className="shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {challenge.description.replace(/#{1,6}\s|```[\s\S]*?```|\*\*|\*/g, "").slice(0, 120)}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {challenge.solved_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            {challenge.solve_rate.toFixed(0)}% solved
          </span>
          {challenge.avg_solve_time_ms > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(challenge.avg_solve_time_ms)}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 font-medium text-primary">
            <Zap className="w-3.5 h-3.5" />
            {challenge.xp_reward} XP
          </span>
        </div>

        {/* Footer: likes + languages + action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="w-3.5 h-3.5" />
              {challenge.likes_count}
            </span>
            <div className="flex items-center gap-1">
              {displayLangs.map((l) => (
                <span
                  key={l}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/60"
                >
                  {getLangLabel(l)}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="text-[10px] text-muted-foreground">+{extraCount}</span>
              )}
            </div>
          </div>

          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium transition-colors",
              challenge.user_solved
                ? "text-green-500"
                : "text-muted-foreground group-hover:text-primary"
            )}
          >
            {challenge.user_solved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Done
              </>
            ) : (
              <>
                Solve
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

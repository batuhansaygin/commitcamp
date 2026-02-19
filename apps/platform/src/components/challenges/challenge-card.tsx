"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DifficultyBadge } from "./difficulty-badge";
import { CategoryBadge } from "./category-badge";
import {
  LANGUAGE_LABELS,
  type Challenge,
  type SupportedLanguage,
} from "@/lib/types/challenges";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  challenge: Challenge;
}

function formatTime(ms: number): string {
  if (ms < 1000) return "< 1s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const router = useRouter();

  const displayLanguages = challenge.supported_languages.slice(0, 2);
  const extraLanguagesCount = challenge.supported_languages.length - 2;

  const getLangLabel = (lang: string): string => {
    return LANGUAGE_LABELS[lang as SupportedLanguage] ?? lang;
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        challenge.user_solved &&
          "border-green-500/30 shadow-green-500/10 shadow-sm"
      )}
      onClick={() => router.push(`/challenges/${challenge.slug}`)}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <DifficultyBadge difficulty={challenge.difficulty} />
            <h3 className="font-semibold text-sm leading-snug truncate">
              {challenge.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {challenge.user_solved && (
              <Badge
                variant="outline"
                className="text-xs text-green-500 border-green-500/30 bg-green-500/10 gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Solved
              </Badge>
            )}
            <CategoryBadge category={challenge.category} />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {challenge.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            {challenge.solve_rate.toFixed(0)}% solve rate
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {challenge.solved_count.toLocaleString()} solved
          </span>
          {challenge.avg_solve_time_ms > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              avg {formatTime(challenge.avg_solve_time_ms)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="w-3.5 h-3.5" />
              {challenge.likes_count.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              {displayLanguages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/50"
                >
                  {getLangLabel(lang)}
                </span>
              ))}
              {extraLanguagesCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  +{extraLanguagesCount} more
                </span>
              )}
            </div>
          </div>

          {challenge.user_solved ? (
            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Done
            </span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/challenges/${challenge.slug}`);
              }}
            >
              Solve
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

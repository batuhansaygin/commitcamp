"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, Calendar, Zap, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Contest, ContestStatus } from "@/lib/types/challenges";

interface ContestCardProps {
  contest: Contest;
  showJoinButton?: boolean;
}

const STATUS_CONFIG: Record<ContestStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  active: { label: "Live", color: "bg-green-500/15 text-green-500 border-green-500/30" },
  ended: { label: "Ended", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startsAt: string, endsAt: string): string {
  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function ContestCard({ contest, showJoinButton = true }: ContestCardProps) {
  const router = useRouter();
  const statusConfig = STATUS_CONFIG[contest.status];
  const isActive = contest.status === "active";
  const isUpcoming = contest.status === "upcoming";

  return (
    <Card
      className={`cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
        isActive ? "border-green-500/30 shadow-green-500/10 shadow-sm" : ""
      }`}
      onClick={() => router.push(`/challenges/contests/${contest.id}`)}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isActive
                  ? "bg-green-500/15"
                  : isUpcoming
                  ? "bg-blue-500/15"
                  : "bg-muted"
              }`}
            >
              <Trophy
                className={`w-4.5 h-4.5 ${
                  isActive
                    ? "text-green-500"
                    : isUpcoming
                    ? "text-blue-500"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-snug truncate">
                {contest.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {contest.description ?? "No description provided."}
              </p>
            </div>
          </div>
          <Badge className={`text-xs shrink-0 ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Timing */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(contest.starts_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(contest.starts_at, contest.ends_at)} duration
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {contest.participants_count.toLocaleString()}
          </span>
        </div>

        {/* XP prizes */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Prizes:</span>
          {[
            { label: "🥇 1st", xp: contest.xp_first_place },
            { label: "🥈 2nd", xp: contest.xp_second_place },
            { label: "🥉 3rd", xp: contest.xp_third_place },
          ].map(({ label, xp }) => (
            <span
              key={label}
              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted border border-border/50"
            >
              {label}
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              {xp.toLocaleString()}
            </span>
          ))}
        </div>

        {/* Footer */}
        {showJoinButton && (isActive || isUpcoming) && (
          <div className="flex justify-end pt-1 border-t border-border/50">
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              className="h-7 px-2.5 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/challenges/contests/${contest.id}`);
              }}
            >
              {isActive ? "Join & Compete" : "View Details"}
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

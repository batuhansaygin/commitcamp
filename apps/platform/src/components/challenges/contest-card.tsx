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

const STATUS_CONFIG: Record<ContestStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-blue-500/12 text-blue-500 border-blue-500/30" },
  active:   { label: "Live",     className: "bg-green-500/12 text-green-500 border-green-500/30 animate-pulse" },
  ended:    { label: "Ended",    className: "bg-muted text-muted-foreground border-border/60" },
};

const ICON_CONFIG: Record<ContestStatus, { bg: string; color: string }> = {
  upcoming: { bg: "bg-blue-500/12 ring-1 ring-blue-500/20",  color: "text-blue-500"  },
  active:   { bg: "bg-green-500/12 ring-1 ring-green-500/20", color: "text-green-500" },
  ended:    { bg: "bg-muted",                                 color: "text-muted-foreground" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(starts: string, ends: string) {
  const diff = new Date(ends).getTime() - new Date(starts).getTime();
  const h = Math.round(diff / 3_600_000);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

export function ContestCard({ contest, showJoinButton = true }: ContestCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[contest.status];
  const icon  = ICON_CONFIG[contest.status];
  const isActive   = contest.status === "active";
  const isUpcoming = contest.status === "upcoming";

  return (
    <Card
      className={[
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        isActive ? "border-green-500/35 bg-green-500/[0.02]" : "hover:border-primary/20",
      ].join(" ")}
      onClick={() => router.push(`/challenges/contests/${contest.id}`)}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${icon.bg}`}>
              <Trophy className={`w-5 h-5 ${icon.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">
                {contest.title}
              </h3>
              {contest.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {contest.description}
                </p>
              )}
            </div>
          </div>
          <Badge className={`text-xs shrink-0 border ${status.className}`}>
            {status.label}
          </Badge>
        </div>

        {/* Timing row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(contest.starts_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(contest.starts_at, contest.ends_at)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {contest.participants_count.toLocaleString()} joined
          </span>
        </div>

        {/* Prizes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-0.5">Prizes:</span>
          {[
            { label: "🥇 1st", xp: contest.xp_first_place },
            { label: "🥈 2nd", xp: contest.xp_second_place },
            { label: "🥉 3rd", xp: contest.xp_third_place },
          ].map(({ label, xp }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-muted border border-border/60"
            >
              {label}
              <Zap className="w-3 h-3 text-amber-500" />
              {xp.toLocaleString()}
            </span>
          ))}
        </div>

        {/* CTA */}
        {showJoinButton && (isActive || isUpcoming) && (
          <div className="flex justify-end border-t border-border/50 pt-3">
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              className="gap-1.5 text-xs"
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

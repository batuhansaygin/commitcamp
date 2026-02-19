"use client";

import { cn } from "@/lib/utils";
import { AI_MODELS } from "@/lib/ai/config";
import type { AIModelKey } from "@/lib/ai/config";

interface AIUsageIndicatorProps {
  used: number;
  total: number;
  modelKey: AIModelKey;
  compact?: boolean;
}

export function AIUsageIndicator({
  used,
  total,
  modelKey,
  compact = false,
}: AIUsageIndicatorProps) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const remaining = Math.max(0, total - used);
  const isLimitReached = remaining === 0;

  const barColor = isLimitReached
    ? "bg-red-500"
    : pct >= 80
    ? "bg-orange-500"
    : pct >= 50
    ? "bg-yellow-500"
    : "bg-green-500";

  const textColor = isLimitReached
    ? "text-red-500"
    : pct >= 80
    ? "text-orange-500"
    : "text-muted-foreground";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn("text-[10px] font-medium tabular-nums", textColor)}>
          {isLimitReached ? "Limit reached" : `${remaining} left`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Daily Usage
        </span>
        <span className={cn("text-xs font-semibold tabular-nums", textColor)}>
          {used}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {isLimitReached
          ? "Daily limit reached. Resets at midnight UTC."
          : `${remaining} of ${total} requests remaining · Resets daily`}
      </p>
      <p className="text-[10px] text-muted-foreground/70">
        Using {AI_MODELS[modelKey].name}
      </p>
    </div>
  );
}

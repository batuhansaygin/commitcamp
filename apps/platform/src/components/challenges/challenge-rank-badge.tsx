import { cn } from "@/lib/utils";
import {
  RANK_CONFIG,
  type ChallengeRank,
} from "@/lib/types/challenges";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  rank: ChallengeRank;
  totalSolved?: number;
  className?: string;
}

const RANK_ORDER: ChallengeRank[] = [
  "unranked",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "grandmaster",
];

function getNextRank(rank: ChallengeRank): ChallengeRank | null {
  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1 || idx === RANK_ORDER.length - 1) return null;
  return RANK_ORDER[idx + 1];
}

function getTooltipText(rank: ChallengeRank, totalSolved: number): string {
  const nextRank = getNextRank(rank);
  if (!nextRank) return "You've reached the highest rank!";
  const nextConfig = RANK_CONFIG[nextRank];
  const remaining = nextConfig.minSolved - totalSolved;
  if (remaining <= 0) return `Next: ${nextConfig.label}`;
  return `${remaining} more solve${remaining === 1 ? "" : "s"} to reach ${nextConfig.label}`;
}

export function ChallengeRankBadge({ rank, totalSolved = 0, className }: Props) {
  const config = RANK_CONFIG[rank];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border cursor-default select-none",
              className
            )}
            style={{
              color: config.color,
              borderColor: `${config.color}40`,
              backgroundColor: `${config.color}15`,
            }}
          >
            <span role="img" aria-label={config.label}>
              {config.icon}
            </span>
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText(rank, totalSolved)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

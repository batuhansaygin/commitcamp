import { cn } from "@/lib/utils";
import {
  DIFFICULTY_CONFIG,
  type ChallengeDifficulty,
} from "@/lib/types/challenges";
import { Badge } from "@/components/ui/badge";

interface Props {
  difficulty: ChallengeDifficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: Props) {
  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium border",
        config.bgClass,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

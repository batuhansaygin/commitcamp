import { cn } from "@/lib/utils";
import {
  CATEGORY_CONFIG,
  type ChallengeCategory,
} from "@/lib/types/challenges";

interface Props {
  category: ChallengeCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: Props) {
  const config = CATEGORY_CONFIG[category];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        "bg-muted text-muted-foreground border border-border/50",
        className
      )}
    >
      <span role="img" aria-label={config.label} className="text-[10px]">
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}

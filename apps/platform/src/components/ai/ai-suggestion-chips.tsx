"use client";

import { cn } from "@/lib/utils";

interface SuggestionChip {
  label: string;
  prompt: string;
  icon: string;
}

const SUGGESTIONS: SuggestionChip[] = [
  {
    label: "Review my code",
    prompt: "Please review this code for best practices, performance, and security issues:\n\n```\n// paste your code here\n```",
    icon: "🔍",
  },
  {
    label: "Explain this concept",
    prompt: "Explain this concept clearly with examples:\n\n",
    icon: "💡",
  },
  {
    label: "Debug this error",
    prompt: "I'm getting this error. Help me debug it:\n\nError:\n```\n// paste error here\n```\n\nCode:\n```\n// paste relevant code\n```",
    icon: "🐛",
  },
  {
    label: "Write a function",
    prompt: "Write a function that:\n\n",
    icon: "⚡",
  },
  {
    label: "Convert to TypeScript",
    prompt: "Convert this JavaScript/Python code to TypeScript:\n\n```javascript\n// paste your code here\n```",
    icon: "🔄",
  },
  {
    label: "Optimize this code",
    prompt: "Optimize this code for better performance:\n\n```\n// paste your code here\n```",
    icon: "🚀",
  },
  {
    label: "Explain Big O",
    prompt: "Explain the time and space complexity (Big O notation) of this algorithm:\n\n```\n// paste your code here\n```",
    icon: "📊",
  },
  {
    label: "Generate REST API",
    prompt: "Generate a REST API with the following requirements:\n\n",
    icon: "🌐",
  },
];

interface AISuggestionChipsProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

export function AISuggestionChips({
  onSelect,
  className,
}: AISuggestionChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {SUGGESTIONS.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.prompt)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground",
            "transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground active:scale-95"
          )}
        >
          <span>{chip.icon}</span>
          {chip.label}
        </button>
      ))}
    </div>
  );
}

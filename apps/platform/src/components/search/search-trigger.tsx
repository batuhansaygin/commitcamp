"use client";

import { useTranslations } from "@/lib/i18n";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  const t = useTranslations("search");

  function handleClick() {
    document.dispatchEvent(new CustomEvent("open-search-command"));
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden md:inline">{t("trigger")}</span>
      <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

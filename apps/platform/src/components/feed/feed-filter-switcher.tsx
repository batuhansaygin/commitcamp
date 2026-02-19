"use client";

import { useTranslations } from "@/lib/i18n";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeedMode } from "@/lib/actions/feed";
import { Users, UserCheck } from "lucide-react";

interface FeedFilterSwitcherProps {
  currentMode: FeedMode;
}

export function FeedFilterSwitcher({ currentMode }: FeedFilterSwitcherProps) {
  const t = useTranslations("feed");
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = (mode: FeedMode) => {
    if (mode === "all") return pathname;
    return `${pathname}?filter=following`;
  };

  return (
    <div
      className="flex rounded-lg border border-border bg-muted/30 p-0.5"
      role="group"
      aria-label={t("filterLabel")}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
          currentMode === "all"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => router.push(buildUrl("all"))}
        aria-pressed={currentMode === "all"}
      >
        <Users className="h-3.5 w-3.5" />
        {t("all")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
          currentMode === "following"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => router.push(buildUrl("following"))}
        aria-pressed={currentMode === "following"}
      >
        <UserCheck className="h-3.5 w-3.5" />
        {t("following")}
      </Button>
    </div>
  );
}

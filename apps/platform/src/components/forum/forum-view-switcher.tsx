"use client";

import { useTranslations } from "@/lib/i18n";
import { useRouter, usePathname } from "@/i18n/navigation";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ForumView = "grid" | "flow";

interface ForumViewSwitcherProps {
  currentView: ForumView;
  typeParam?: string;
}

export function ForumViewSwitcher({
  currentView,
  typeParam,
}: ForumViewSwitcherProps) {
  const t = useTranslations("forum");
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = (view: ForumView) => {
    const params = new URLSearchParams();
    if (view !== "flow") params.set("view", view);
    if (typeParam) params.set("type", typeParam);
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  return (
    <div
      className="flex rounded-lg border border-border bg-muted/30 p-0.5"
      role="group"
      aria-label={t("viewSwitcherLabel")}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
          currentView === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => router.push(buildUrl("grid"))}
        aria-pressed={currentView === "grid"}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {t("viewGrid")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
          currentView === "flow"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => router.push(buildUrl("flow"))}
        aria-pressed={currentView === "flow"}
      >
        <List className="h-3.5 w-3.5" />
        {t("viewFlow")}
      </Button>
    </div>
  );
}

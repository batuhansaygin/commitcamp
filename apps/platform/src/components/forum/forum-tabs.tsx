"use client";

import { useTranslations } from "@/lib/i18n";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PostType } from "@/lib/types/posts";
import type { ForumView } from "./forum-view-switcher";

interface ForumTabsProps {
  activeType?: PostType;
  currentView?: ForumView;
}

const TABS: { key: string; type?: PostType }[] = [
  { key: "all" },
  { key: "types.discussion", type: "discussion" },
  { key: "types.question", type: "question" },
  { key: "types.showcase", type: "showcase" },
];

export function ForumTabs({ activeType, currentView }: ForumTabsProps) {
  const t = useTranslations("forum");
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = (type?: PostType) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (currentView === "flow") params.set("view", "flow");
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  const navigate = (type?: PostType) => {
    router.push(buildUrl(type));
  };

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {TABS.map((tab) => {
        const isActive = tab.type === activeType;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.type)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(tab.key)}
          </button>
        );
      })}
    </div>
  );
}

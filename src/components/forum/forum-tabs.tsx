"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PostType } from "@/lib/types/posts";

interface ForumTabsProps {
  activeType?: PostType;
}

const TABS: { key: string; type?: PostType }[] = [
  { key: "all" },
  { key: "types.discussion", type: "discussion" },
  { key: "types.question", type: "question" },
  { key: "types.showcase", type: "showcase" },
];

export function ForumTabs({ activeType }: ForumTabsProps) {
  const t = useTranslations("forum");
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (type?: PostType) => {
    if (type) {
      router.push(`${pathname}?type=${type}`);
    } else {
      router.push(pathname);
    }
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

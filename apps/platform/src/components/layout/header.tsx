"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Sun, Moon, Monitor, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VersionBadge } from "@/components/ui/version-badge";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchTrigger } from "@/components/search/search-trigger";
import { useState, useEffect } from "react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

export function Header({
  onToggleSidebar,
  showMenuButton = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common");
  const [mounted, setMounted] = useState(false);

  function openSearch() {
    document.dispatchEvent(new CustomEvent("open-search-command"));
  }

  useEffect(() => setMounted(true), []);

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const themeIcon = mounted ? (
    theme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : theme === "light" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    )
  ) : (
    <Monitor className="h-4 w-4" />
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      {showMenuButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <Link href="/" className="flex items-center gap-2 font-bold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-accent to-purple-accent">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path
              d="M9 10h10M9 14h7M9 18h10"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="hidden sm:inline gradient-text text-lg">
          CommitCamp
        </span>
        <VersionBadge className="hidden sm:inline-flex" />
      </Link>

      <div className="flex-1 px-2 md:px-4 max-w-xs">
        <SearchTrigger className="w-full" />
      </div>

      <nav className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => openSearch()}
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={t("theme")}
        >
          {themeIcon}
          <span className="sr-only">{t("theme")}</span>
        </Button>

        <NotificationBell />
        <UserMenu />
      </nav>
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { useTheme } from "next-themes";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, GitCommit, X, Sun, Moon, Monitor } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", labelKey: "features" },
  { href: "#community", labelKey: "community" },
  { href: "#leaderboard", labelKey: "openSource" },
] as const;

export function LandingNavbar() {
  const t = useTranslations("landing.nav");
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const ThemeIcon = mounted
    ? theme === "dark"
      ? Moon
      : theme === "light"
        ? Sun
        : Monitor
    : Monitor;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/50 bg-background/90 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 shadow-md shadow-cyan-500/20 transition-transform group-hover:scale-105">
            <GitCommit className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">CommitCamp</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, labelKey }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(labelKey)}
            </a>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            title="Toggle theme"
            className="h-9 w-9"
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm">
              {t("signIn")}
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-md shadow-cyan-500/20 border-0"
            >
              {t("getStarted")}
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            className="h-9 w-9"
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 pt-12">
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map(({ href, labelKey }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {t(labelKey)}
                  </a>
                ))}
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cycleTheme}
                    className="w-full"
                  >
                    <ThemeIcon className="mr-1.5 h-3.5 w-3.5" />
                    Theme
                  </Button>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t("signIn")}
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0">
                      {t("getStarted")}
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { GitCommit, Github, Twitter } from "lucide-react";

interface FooterLink {
  labelKey: string;
  href: string;
  comingSoon?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { labelKey: "features", href: "#features" },
  { labelKey: "leaderboard", href: "/feed" },
  { labelKey: "playground", href: "#", comingSoon: true },
  { labelKey: "aiAssistant", href: "#", comingSoon: true },
];

const RESOURCE_LINKS: FooterLink[] = [
  { labelKey: "documentation", href: "#", comingSoon: true },
  { labelKey: "blog", href: "#", comingSoon: true },
  { labelKey: "api", href: "#", comingSoon: true },
  { labelKey: "status", href: "#", comingSoon: true },
];

const COMPANY_LINKS: FooterLink[] = [
  { labelKey: "about", href: "#", comingSoon: true },
  { labelKey: "privacy", href: "/privacy" },
  { labelKey: "terms", href: "/terms" },
  { labelKey: "contact", href: "mailto:support@commitcamp.com" },
];

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-border/40 bg-zinc-950 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Main footer content */}
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 shadow-md">
                <GitCommit className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-zinc-100">CommitCamp</span>
            </Link>
            <p className="mt-3 text-sm text-zinc-500 leading-relaxed max-w-[200px]">
              {t("tagline")}
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {t("product")}
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map(({ labelKey, href, comingSoon }) => (
                <li key={labelKey}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {t(labelKey)}
                    {comingSoon && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium">
                        {t("comingSoon")}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {t("resources")}
            </h3>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map(({ labelKey, href, comingSoon }) => (
                <li key={labelKey}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {t(labelKey)}
                    {comingSoon && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium">
                        {t("comingSoon")}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              {t("company")}
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(({ labelKey, href, comingSoon }) => (
                <li key={labelKey}>
                  <a
                    href={href}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {t(labelKey)}
                    {comingSoon && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-medium">
                        {t("comingSoon")}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800/60 py-6 text-xs text-zinc-600 sm:flex-row">
          <span>{t("copyright")}</span>
          <span>{t("madeWith")}</span>
        </div>
      </div>
    </footer>
  );
}

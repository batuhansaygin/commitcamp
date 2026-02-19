"use client";

import { useTranslations } from "@/lib/i18n";
import { AnimatedCounter } from "./motion-wrappers";
import { Users, FileText, Code2, Globe } from "lucide-react";
import type { LandingStats } from "@/lib/actions/landing";

interface StatsBarProps {
  stats: LandingStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const t = useTranslations("landing.stats");

  const items = [
    {
      icon: Users,
      value: stats.totalUsers,
      suffix: "+",
      label: t("developers"),
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      icon: FileText,
      value: stats.totalPosts,
      suffix: "+",
      label: t("posts"),
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Code2,
      value: stats.techCount,
      suffix: "+",
      label: t("technologies"),
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Globe,
      value: stats.countryCount,
      suffix: "+",
      label: t("countries"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <section className="border-y border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/30 md:grid-cols-4 md:divide-y-0">
          {items.map(({ icon: Icon, value, suffix, label, color, bg }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-3 px-6 py-8 md:py-10"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-black text-foreground md:text-3xl">
                  <AnimatedCounter target={value} suffix={suffix} duration={2} />
                </div>
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

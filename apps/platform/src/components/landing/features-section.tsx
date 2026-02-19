"use client";

import { useTranslations } from "@/lib/i18n";
import { StaggerContainer, StaggerItem } from "./motion-wrappers";
import { FadeInUp } from "./motion-wrappers";
import { Code2, FileText, Rocket, Trophy, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Code2,
    titleKey: "codeSharing.title",
    descKey: "codeSharing.description",
    gradient: "from-cyan-500 to-blue-500",
    glow: "group-hover:shadow-cyan-500/20",
    visual: <CodeVisual />,
  },
  {
    icon: FileText,
    titleKey: "blog.title",
    descKey: "blog.description",
    gradient: "from-purple-500 to-violet-500",
    glow: "group-hover:shadow-purple-500/20",
    visual: <BlogVisual />,
  },
  {
    icon: Rocket,
    titleKey: "showcase.title",
    descKey: "showcase.description",
    gradient: "from-orange-500 to-pink-500",
    glow: "group-hover:shadow-orange-500/20",
    visual: <ShowcaseVisual />,
  },
  {
    icon: Trophy,
    titleKey: "xp.title",
    descKey: "xp.description",
    gradient: "from-yellow-500 to-amber-500",
    glow: "group-hover:shadow-yellow-500/20",
    visual: <XpVisual />,
  },
  {
    icon: Bell,
    titleKey: "notifications.title",
    descKey: "notifications.description",
    gradient: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/20",
    visual: <NotificationsVisual />,
  },
  {
    icon: Search,
    titleKey: "search.title",
    descKey: "search.description",
    gradient: "from-blue-500 to-indigo-500",
    glow: "group-hover:shadow-blue-500/20",
    visual: <SearchVisual />,
  },
] as const;

function CodeVisual() {
  return (
    <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 bg-zinc-100 border border-zinc-800 dark:border-zinc-800 border-zinc-200 p-3 font-mono text-[10px] leading-relaxed">
      <div className="flex gap-1.5 mb-2">
        <div className="h-2 w-2 rounded-full bg-red-500/70" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
        <div className="h-2 w-2 rounded-full bg-green-500/70" />
      </div>
      <div className="text-zinc-400 dark:text-zinc-400">
        <span className="text-purple-400">const</span>{" "}
        <span className="text-blue-300">greet</span>{" "}
        <span className="text-zinc-300">=</span>{" "}
        <span className="text-yellow-300">(name: </span>
        <span className="text-orange-300">string</span>
        <span className="text-yellow-300">) =&gt;</span>{" "}
        <span className="text-zinc-300">&#123;</span>
        <br />
        <span className="text-zinc-500 pl-4">// returns greeting</span>
        <br />
        <span className="pl-4 text-purple-400">return</span>{" "}
        <span className="text-green-300">`Hello, $&#123;name&#125;!`</span>
        <br />
        <span className="text-zinc-300">&#125;</span>
      </div>
    </div>
  );
}

function BlogVisual() {
  return (
    <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 bg-zinc-100 border border-zinc-800 dark:border-zinc-800 border-zinc-200 p-3 space-y-1.5">
      <div className="h-2 w-3/4 rounded bg-zinc-700/60 dark:bg-zinc-700/60 bg-zinc-300" />
      <div className="h-1.5 w-full rounded bg-zinc-800/60 dark:bg-zinc-800/60 bg-zinc-200" />
      <div className="h-1.5 w-full rounded bg-zinc-800/60 dark:bg-zinc-800/60 bg-zinc-200" />
      <div className="h-1.5 w-2/3 rounded bg-zinc-800/60 dark:bg-zinc-800/60 bg-zinc-200" />
      <div className="flex items-center gap-1 pt-1">
        <span className="text-[9px] font-bold text-purple-400">#</span>
        <div className="h-1.5 w-10 rounded bg-purple-500/30" />
        <span className="text-[9px] font-bold text-blue-400">#</span>
        <div className="h-1.5 w-8 rounded bg-blue-500/30" />
      </div>
    </div>
  );
}

function ShowcaseVisual() {
  return (
    <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 bg-zinc-100 border border-zinc-800 dark:border-zinc-800 border-zinc-200 p-3 space-y-2">
      <div className="h-14 rounded-md bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/20 flex items-center justify-center">
        <Rocket className="h-5 w-5 text-orange-400/60" />
      </div>
      <div className="space-y-1">
        <div className="h-2 w-2/3 rounded bg-zinc-700/60 dark:bg-zinc-700/60 bg-zinc-300" />
        <div className="flex gap-1">
          {["React", "TS", "AWS"].map((t) => (
            <span key={t} className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 dark:bg-zinc-800 bg-zinc-200 text-zinc-400 dark:text-zinc-400 text-zinc-600">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function XpVisual() {
  const tiers = [
    { label: "Bronze", color: "#cd7f32" },
    { label: "Silver", color: "#9ca3af" },
    { label: "Gold", color: "#eab308" },
    { label: "Platinum", color: "#06b6d4" },
    { label: "Diamond", color: "#a855f7" },
  ];
  return (
    <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 bg-zinc-100 border border-zinc-800 dark:border-zinc-800 border-zinc-200 p-3">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tiers.map(({ label, color }) => (
          <span
            key={label}
            className="text-[9px] px-1.5 py-0.5 rounded-full border font-semibold"
            style={{ color, borderColor: `${color}44`, backgroundColor: `${color}18` }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300" />
      </div>
      <p className="text-[9px] text-zinc-500 mt-1">8,400 / 12,000 XP</p>
    </div>
  );
}

function NotificationsVisual() {
  const items = [
    { text: "Alex liked your post", icon: "❤️", time: "2m" },
    { text: "You leveled up! → Lvl 25", icon: "⬆️", time: "1h" },
    { text: "Sarah replied to your snippet", icon: "💬", time: "3h" },
  ];
  return (
    <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 bg-zinc-100 border border-zinc-800 dark:border-zinc-800 border-zinc-200 divide-y divide-zinc-800 dark:divide-zinc-800 divide-zinc-200 overflow-hidden">
      {items.map((item) => (
        <div key={item.text} className="flex items-center gap-2 px-3 py-2">
          <span className="text-sm">{item.icon}</span>
          <span className="text-[9px] text-zinc-300 dark:text-zinc-300 text-zinc-700 flex-1 leading-tight">{item.text}</span>
          <span className="text-[8px] text-zinc-600 shrink-0">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 bg-zinc-100 border border-zinc-800 dark:border-zinc-800 border-zinc-200 p-3 space-y-2">
      <div className="flex items-center gap-2 rounded-md bg-zinc-800 dark:bg-zinc-800 bg-zinc-200 px-2 py-1.5">
        <Search className="h-3 w-3 text-zinc-500" />
        <span className="text-[9px] text-zinc-400">Search users, posts, topics...</span>
        <span className="ml-auto text-[8px] text-zinc-600 border border-zinc-700 rounded px-1">⌘K</span>
      </div>
      <div className="space-y-1">
        {["useDebounce hook", "@alexdev", "#typescript"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-800/60 dark:hover:bg-zinc-800/60">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500/60" />
            <span className="text-[9px] text-zinc-400">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <FadeInUp className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </FadeInUp>

        <StaggerContainer className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, titleKey, descKey, gradient, glow, visual }) => (
            <StaggerItem key={titleKey}>
              <div
                className={cn(
                  "group relative rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300",
                  "hover:border-border hover:shadow-xl hover:-translate-y-1",
                  glow
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    gradient
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Text */}
                <h3 className="mb-2 font-semibold text-foreground">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t(descKey)}</p>

                {/* Visual */}
                <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                  {visual}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

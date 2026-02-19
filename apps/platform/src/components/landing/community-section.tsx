"use client";

import { useTranslations } from "@/lib/i18n";
import { StaggerContainer, StaggerItem, FadeInUp } from "./motion-wrappers";
import { LevelBadge } from "@/components/profile/level-badge";

const DEVELOPERS = [
  {
    name: "Sarah Chen",
    username: "sarahchen",
    level: 45,
    bio: "Full-stack developer passionate about React, Next.js, and clean architecture.",
    tech: ["React", "Next.js", "Python"],
    gradient: "from-cyan-400 to-blue-500",
    rotate: "-rotate-1",
  },
  {
    name: "Marcus Johnson",
    username: "marcusj",
    level: 38,
    bio: "Backend engineer. I write Go and think in distributed systems.",
    tech: ["Go", "Docker", "PostgreSQL"],
    gradient: "from-purple-500 to-violet-600",
    rotate: "rotate-1",
  },
  {
    name: "Elena Rodriguez",
    username: "elena_dev",
    level: 52,
    bio: "DevOps & platform engineering. Cloud-native by heart.",
    tech: ["AWS", "Kubernetes", "Rust"],
    gradient: "from-violet-500 to-purple-600",
    rotate: "-rotate-1",
  },
  {
    name: "Alex Kim",
    username: "alexkim",
    level: 29,
    bio: "Mobile & cross-platform dev. Swift fan, TypeScript enthusiast.",
    tech: ["Swift", "Flutter", "TypeScript"],
    gradient: "from-orange-400 to-pink-500",
    rotate: "rotate-2",
  },
  {
    name: "Priya Patel",
    username: "priyap",
    level: 33,
    bio: "Building intelligent systems. ML engineer at heart, Pythonista in practice.",
    tech: ["Python", "TensorFlow", "FastAPI"],
    gradient: "from-emerald-400 to-teal-500",
    rotate: "-rotate-2",
  },
  {
    name: "Tom Weber",
    username: "tomweber",
    level: 21,
    bio: "Frontend craftsman. I care deeply about UX and accessibility.",
    tech: ["Vue.js", "Svelte", "Tailwind"],
    gradient: "from-rose-400 to-pink-500",
    rotate: "rotate-1",
  },
];

export function CommunitySection() {
  const t = useTranslations("landing.community");

  return (
    <section id="community" className="py-24 md:py-32 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <FadeInUp className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </FadeInUp>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEVELOPERS.map((dev) => (
            <StaggerItem key={dev.username}>
              <div
                className={`group rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-lg hover:-translate-y-1 ${dev.rotate} hover:rotate-0`}
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`h-11 w-11 shrink-0 rounded-full bg-gradient-to-br ${dev.gradient} flex items-center justify-center text-base text-white font-bold shadow-md`}
                  >
                    {dev.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{dev.name}</span>
                      <LevelBadge level={dev.level} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">@{dev.username}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                  {dev.bio}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5">
                  {dev.tech.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-muted font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

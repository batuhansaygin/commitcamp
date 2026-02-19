"use client";

import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import { FloatAnimation } from "./motion-wrappers";
import { ArrowRight, Check, GitCommit, Bell, Search, Code2 } from "lucide-react";

// ── Fake feed mockup ──────────────────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 blur-3xl rounded-3xl pointer-events-none" />

      {/* Browser frame */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-700/50 dark:border-zinc-700/50 border-zinc-300/60 bg-zinc-950 dark:bg-zinc-950 shadow-2xl shadow-black/50">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-900 bg-zinc-100 border-b border-zinc-800 dark:border-zinc-800 border-zinc-200">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-3 rounded-full bg-zinc-800 dark:bg-zinc-800 px-3 py-1 text-center">
            <span className="text-[10px] text-zinc-400">commitcamp.com/feed</span>
          </div>
          <div className="w-16" />
        </div>

        {/* App shell */}
        <div className="bg-zinc-950 dark:bg-zinc-950">
          {/* App header */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <GitCommit className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-zinc-100">CommitCamp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5">
                <Search className="h-2.5 w-2.5 text-zinc-500" />
                <span className="text-[9px] text-zinc-500">Search... ⌘K</span>
              </div>
              <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center">
                <Bell className="h-2.5 w-2.5 text-zinc-400" />
              </div>
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                D
              </div>
            </div>
          </div>

          {/* Feed content */}
          <div className="p-3 space-y-2.5">
            {/* Post 1 — Discussion */}
            <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60 hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-semibold tracking-wide uppercase">discussion</span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-200 mb-1 leading-snug">
                Building a Full-Stack App with Next.js 15 &amp; Supabase
              </p>
              <p className="text-[9px] text-zinc-500 mb-2 line-clamp-1">
                Deep dive into the new caching model and server actions...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[7px] text-white font-bold">A</div>
                  <span className="text-[9px] text-zinc-500">@alexdev</span>
                  <span className="text-[8px] px-1 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Lvl 24</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                  <span>❤️ 42</span>
                  <span>💬 18</span>
                </div>
              </div>
            </div>

            {/* Post 2 — Snippet */}
            <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60 hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-semibold tracking-wide uppercase">snippet</span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-200 mb-1">
                useDebounce — TypeScript React Hook
              </p>
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-2 font-mono text-[9px] leading-relaxed mb-2">
                <span className="text-purple-400">function </span>
                <span className="text-blue-300">useDebounce</span>
                <span className="text-zinc-400">&lt;T&gt;</span>
                <span className="text-zinc-300">(value: T, delay: </span>
                <span className="text-orange-300">number</span>
                <span className="text-zinc-300">): T</span>
                <br />
                <span className="text-zinc-600">  // debounced state management</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[7px] text-white font-bold">J</div>
                  <span className="text-[9px] text-zinc-500">@janesmith</span>
                  <span className="text-[8px] px-1 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">Lvl 38</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                  <span>❤️ 128</span>
                  <span>💬 24</span>
                </div>
              </div>
            </div>

            {/* Post 3 — Showcase */}
            <div className="border border-zinc-800/80 rounded-xl p-3 bg-zinc-900/60 hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 font-semibold tracking-wide uppercase">showcase</span>
              </div>
              <p className="text-[11px] font-semibold text-zinc-200 mb-1">
                My Developer Portfolio — Built with Next.js &amp; Tailwind
              </p>
              <div className="flex items-center gap-1 mb-2">
                {["Next.js", "TypeScript", "Tailwind"].map((tag) => (
                  <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-[7px] text-white font-bold">M</div>
                  <span className="text-[9px] text-zinc-500">@maria_dev</span>
                  <span className="text-[8px] px-1 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">Lvl 31</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                  <span>❤️ 67</span>
                  <span>🔖 14</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HeroSection ───────────────────────────────────────────────────────────────

export function HeroSection() {
  const t = useTranslations("landing.hero");

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[700px] w-[700px] rounded-full bg-gradient-to-bl from-cyan-500/8 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-purple-500/8 to-transparent blur-3xl" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center rounded-full border border-border bg-muted/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm"
          >
            <Code2 className="mr-1.5 h-3 w-3 text-cyan-500" />
            The social platform for developers
          </motion.div>

          {/* Headline */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl font-black tracking-tight md:text-7xl lg:text-8xl leading-none"
            >
              {t("titleLine1")}
            </motion.h1>
            <motion.h1
              variants={itemVariants}
              className="text-5xl font-black tracking-tight md:text-7xl lg:text-8xl leading-none bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              {t("titleLine2")}
            </motion.h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            {t("subtitle")}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="h-12 px-8 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 border-0 shadow-xl shadow-cyan-500/25 text-base font-semibold transition-all hover:scale-105 hover:shadow-cyan-500/40"
              >
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-semibold border-border/80 hover:border-border bg-background/50 backdrop-blur-sm"
              >
                {t("ctaSecondary")}
              </Button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"
          >
            {[
              t("trustFree"),
              t("trustNoCard"),
              t("trustOpenSource"),
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-500" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* App mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 1, ease: "easeOut" }}
            className="mt-16 w-full max-w-2xl"
          >
            <FloatAnimation>
              <AppMockup />
            </FloatAnimation>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

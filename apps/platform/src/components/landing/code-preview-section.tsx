"use client";

import { useTranslations } from "@/lib/i18n";
import { FadeInLeft, FadeInRight } from "./motion-wrappers";
import { Badge } from "@/components/ui/badge";

const LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust",
  "Java", "C#", "Ruby", "Kotlin", "Swift",
];

const CODE_LINES = [
  { tokens: [{ t: "import", c: "text-purple-400" }, { t: " { useState, useEffect }", c: "text-zinc-300" }, { t: " from", c: "text-purple-400" }, { t: ' "react"', c: "text-green-300" }] },
  { tokens: [] },
  { tokens: [{ t: "function ", c: "text-purple-400" }, { t: "useDebounce", c: "text-blue-300" }, { t: "<T>", c: "text-yellow-300" }, { t: "(", c: "text-zinc-300" }, { t: "value", c: "text-orange-300" }, { t: ": T, ", c: "text-zinc-300" }, { t: "delay", c: "text-orange-300" }, { t: ": ", c: "text-zinc-300" }, { t: "number", c: "text-cyan-300" }, { t: "): T {", c: "text-zinc-300" }] },
  { tokens: [{ t: "  ", c: "" }, { t: "const ", c: "text-purple-400" }, { t: "[debouncedValue, setDebouncedValue]", c: "text-zinc-300" }, { t: " =", c: "text-zinc-300" }] },
  { tokens: [{ t: "    useState", c: "text-blue-300" }, { t: "<T>(", c: "text-yellow-300" }, { t: "value", c: "text-orange-300" }, { t: ");", c: "text-zinc-300" }] },
  { tokens: [] },
  { tokens: [{ t: "  useEffect", c: "text-blue-300" }, { t: "(() => {", c: "text-zinc-300" }] },
  { tokens: [{ t: "    ", c: "" }, { t: "const ", c: "text-purple-400" }, { t: "timer ", c: "text-zinc-300" }, { t: "= setTimeout(() =>", c: "text-zinc-300" }] },
  { tokens: [{ t: "      setDebouncedValue(", c: "text-blue-300" }, { t: "value", c: "text-orange-300" }, { t: "), ", c: "text-zinc-300" }, { t: "delay", c: "text-orange-300" }, { t: ");", c: "text-zinc-300" }] },
  { tokens: [{ t: "    ", c: "" }, { t: "return ", c: "text-purple-400" }, { t: "() => clearTimeout(", c: "text-zinc-300" }, { t: "timer", c: "text-zinc-300" }, { t: ");", c: "text-zinc-300" }] },
  { tokens: [{ t: "  }, [", c: "text-zinc-300" }, { t: "value", c: "text-orange-300" }, { t: ", ", c: "text-zinc-300" }, { t: "delay", c: "text-orange-300" }, { t: "]);", c: "text-zinc-300" }] },
  { tokens: [] },
  { tokens: [{ t: "  ", c: "" }, { t: "return ", c: "text-purple-400" }, { t: "debouncedValue;", c: "text-zinc-300" }] },
  { tokens: [{ t: "}", c: "text-zinc-300" }] },
];

function CodeCard() {
  return (
    <div className="rounded-2xl border border-zinc-700/50 dark:border-zinc-700/50 border-zinc-300/70 bg-zinc-950 dark:bg-zinc-950 bg-white overflow-hidden shadow-2xl shadow-black/30">
      {/* Post header */}
      <div className="border-b border-zinc-800 dark:border-zinc-800 border-zinc-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm text-white font-bold">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-100 dark:text-zinc-100 text-zinc-900">CommitCamp Team</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-yellow-400 text-white font-semibold animate-pulse">
                  Lvl 50
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">@commitcamp</span>
            </div>
          </div>
          <span className="text-[9px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 font-semibold uppercase tracking-wide">snippet</span>
        </div>
      </div>

      {/* Post title */}
      <div className="px-5 pt-4 pb-3">
        <h4 className="font-semibold text-zinc-100 dark:text-zinc-100 text-zinc-900 mb-1">
          Custom React Hook: useDebounce
        </h4>
        <div className="flex gap-1.5">
          {["#react", "#hooks", "#typescript"].map((tag) => (
            <span key={tag} className="text-[10px] text-cyan-500">{tag}</span>
          ))}
        </div>
      </div>

      {/* Code block */}
      <div className="mx-4 mb-4 rounded-xl bg-black/60 border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 border-b border-zinc-800">
          <div className="h-2 w-2 rounded-full bg-red-500/70" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <div className="h-2 w-2 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[9px] text-zinc-500">useDebounce.ts</span>
        </div>
        <div className="px-4 py-3 font-mono text-[10px] leading-relaxed overflow-x-auto">
          {CODE_LINES.map((line, i) => (
            <div key={i} className="flex items-start">
              <span className="select-none w-6 text-right mr-4 text-zinc-700 shrink-0">{i + 1}</span>
              <span>
                {line.tokens.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  line.tokens.map((token, j) => (
                    <span key={j} className={token.c}>{token.t}</span>
                  ))
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 border-t border-zinc-800 dark:border-zinc-800 border-zinc-200 px-5 py-3">
        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-pink-400 transition-colors">
          <span>❤️</span>
          <span>128</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-400 transition-colors">
          <span>💬</span>
          <span>24</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors">
          <span>🔖</span>
          <span>41</span>
        </button>
      </div>
    </div>
  );
}

export function CodePreviewSection() {
  const t = useTranslations("landing.codePreview");

  return (
    <section className="py-24 md:py-32 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: text */}
          <FadeInLeft>
            <span className="text-sm font-semibold text-cyan-500 uppercase tracking-widest">
              {t("label")}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("description")}
            </p>

            <div className="mt-8">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Supported Languages
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +40 more
                </Badge>
              </div>
            </div>
          </FadeInLeft>

          {/* Right: code card */}
          <FadeInRight delay={0.1}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-2xl rounded-3xl pointer-events-none" />
              <CodeCard />
            </div>
          </FadeInRight>
        </div>
      </div>
    </section>
  );
}

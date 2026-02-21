import { setRequestLocale } from "@/lib/i18n-server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ToolsSaveSwitch } from "@/components/tools/tools-save-switch";
import { ToolsHistorySection } from "@/components/tools/tools-history-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Braces,
  Regex,
  Lock,
  Palette,
  Fingerprint,
  KeyRound,
  Clock,
  Type,
  ArrowRight,
  Zap,
  Shield,
  Wifi,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Tools — CommitCamp",
  description:
    "Free, browser-based developer tools. Format JSON, test regex, encode/decode, generate UUIDs, and more.",
};

interface PageProps {
  params?: Promise<{ locale?: string }>;
}

interface Tool {
  href: string;
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  category: string;
  color: string;
  iconBg: string;
  badge?: string;
}

const TOOLS: Tool[] = [
  {
    href: "/tools/json-formatter",
    icon: Braces,
    title: "JSON Formatter",
    description:
      "Format, validate and minify JSON with live syntax highlighting. Instantly spot errors.",
    category: "Format",
    color: "text-cyan-400",
    iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    badge: "Popular",
  },
  {
    href: "/tools/regex-tester",
    icon: Regex,
    title: "Regex Tester",
    description:
      "Test regular expressions in real-time with match highlighting, flags, and capture groups.",
    category: "Validate",
    color: "text-violet-400",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
  },
  {
    href: "/tools/base64-encoder",
    icon: Lock,
    title: "Base64 / URL Encoder",
    description:
      "Encode and decode Base64 and URL-safe strings instantly. Supports both standard and URL-safe variants.",
    category: "Encode",
    color: "text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
  },
  {
    href: "/tools/color-converter",
    icon: Palette,
    title: "Color Converter",
    description:
      "Convert between HEX, RGB and HSL with an interactive picker and automatic palette generation.",
    category: "Convert",
    color: "text-pink-400",
    iconBg: "bg-pink-500/10 dark:bg-pink-500/15",
  },
  {
    href: "/tools/uuid-generator",
    icon: Fingerprint,
    title: "UUID & Hash Generator",
    description:
      "Generate UUID v4 identifiers in bulk and compute SHA-1, SHA-256, SHA-512 hashes from any text.",
    category: "Generate",
    color: "text-orange-400",
    iconBg: "bg-orange-500/10 dark:bg-orange-500/15",
    badge: "New",
  },
  {
    href: "/tools/jwt-decoder",
    icon: KeyRound,
    title: "JWT Decoder",
    description:
      "Decode JSON Web Tokens and inspect the header, payload, signature, and expiry status.",
    category: "Decode",
    color: "text-yellow-400",
    iconBg: "bg-yellow-500/10 dark:bg-yellow-500/15",
  },
  {
    href: "/tools/timestamp-converter",
    icon: Clock,
    title: "Timestamp Converter",
    description:
      "Convert between Unix timestamps and human-readable dates. Supports seconds and milliseconds.",
    category: "Convert",
    color: "text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
  },
  {
    href: "/tools/lorem-generator",
    icon: Type,
    title: "Lorem Ipsum Generator",
    description:
      "Generate placeholder text by paragraph, sentence, or word count with optional HTML wrapping.",
    category: "Generate",
    color: "text-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/15",
  },
];

const CATEGORIES = ["All", "Format", "Validate", "Encode", "Decode", "Convert", "Generate"];

const STATS = [
  { icon: Package, value: "8", label: "Tools" },
  { icon: Zap, value: "100%", label: "Free" },
  { icon: Wifi, value: "0", label: "Server calls" },
  { icon: Shield, value: "Private", label: "No data stored" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Format: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  Validate: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Encode: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Decode: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Convert: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Generate: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export default async function ToolsPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="mx-auto max-w-5xl w-full space-y-10">
      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-cyan-accent/5 px-6 py-10 sm:px-10 sm:py-14">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-accent/10 blur-3xl" />

        <div className="relative space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            All tools run 100% in your browser
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
            <span className="gradient-text">Developer</span>{" "}
            <span className="text-foreground">Toolbox</span>
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base max-w-lg leading-relaxed">
            Free, fast, and privacy-first tools built for developers. No
            account required, no data sent to any server.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 pt-2">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 border border-border/60">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">
                    {value}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category filter pills ─────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className={cn(
              "cursor-default rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              cat === "All"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              cat !== "All" && CATEGORY_COLORS[cat]
                ? `${CATEGORY_COLORS[cat]} border-transparent`
                : ""
            )}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* ── Tools grid ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className="group block h-full">
              <Card className="relative h-full overflow-hidden border-border/60 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-black/5 dark:group-hover:shadow-black/20">
                {/* Top colored strip */}
                <div
                  className={cn(
                    "h-1 w-full",
                    tool.color
                      .replace("text-", "bg-")
                      .replace("-400", "-500")
                      .replace("dark:text-", "")
                      .split(" ")[0]
                  )}
                  style={{
                    background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
                  }}
                />

                <CardContent className="p-5 flex flex-col gap-4 h-full">
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        tool.iconBg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", tool.color)} />
                    </div>
                    {tool.badge && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 font-semibold",
                          tool.badge === "Popular" &&
                            "bg-primary/10 text-primary border-primary/20",
                          tool.badge === "New" &&
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        )}
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                        {tool.title}
                      </h2>
                    </div>
                    <span
                      className={cn(
                        "inline-block rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                        CATEGORY_COLORS[tool.category] ??
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {tool.category}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-1">
                      {tool.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-200 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
                    Open Tool
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Save history + Recent usage (when logged in) ──── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ToolsSaveSwitch />
        </div>
        <div>
          <ToolsHistorySection isLoggedIn={isLoggedIn} />
        </div>
      </div>

      {/* ── Bottom CTA banner ─────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="font-bold text-sm text-foreground">
            More tools coming soon
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Have a tool request? Share it in the forum.
          </p>
        </div>
        <Link href="/forum/new">
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
            Request a Tool
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

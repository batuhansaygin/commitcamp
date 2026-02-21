"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getToolHistory, type ToolHistoryEntry } from "@/lib/actions/tool-history";
import { History, ChevronRight, Wrench } from "lucide-react";

function formatTimeAgo(dateStr: string): string {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TOOL_SLUG_TO_TITLE: Record<string, string> = {
  "json-formatter": "JSON Formatter",
  "regex-tester": "Regex Tester",
  "base64-encoder": "Base64 Encoder",
  "color-converter": "Color Converter",
  "uuid-generator": "UUID Generator",
  "jwt-decoder": "JWT Decoder",
  "timestamp-converter": "Timestamp Converter",
  "lorem-generator": "Lorem Generator",
};
const TOOL_SLUG_TO_HREF: Record<string, string> = {
  "json-formatter": "/tools/json-formatter",
  "regex-tester": "/tools/regex-tester",
  "base64-encoder": "/tools/base64-encoder",
  "color-converter": "/tools/color-converter",
  "uuid-generator": "/tools/uuid-generator",
  "jwt-decoder": "/tools/jwt-decoder",
  "timestamp-converter": "/tools/timestamp-converter",
  "lorem-generator": "/tools/lorem-generator",
};

function HistoryItem({ entry }: { entry: ToolHistoryEntry }) {
  const href = TOOL_SLUG_TO_HREF[entry.tool_slug] ?? `/tools/${entry.tool_slug}`;
  const title = TOOL_SLUG_TO_TITLE[entry.tool_slug] ?? entry.tool_slug;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40 hover:border-primary/20"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Wrench className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">
          {entry.summary || formatTimeAgo(entry.created_at)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}

export function ToolsHistorySection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("tools");
  const [entries, setEntries] = useState<ToolHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setEntries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getToolHistory(10).then(({ data }) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <History className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t("loginToSave")}</p>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t("recentUsage")}</h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {t("noHistory")}
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


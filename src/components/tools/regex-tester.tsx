"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface RegexMatch {
  value: string;
  index: number;
  groups: string[];
}

const PRESETS = [
  { label: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
  { label: "URL", pattern: "https?://[^\\s]+" },
  { label: "IP Address", pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b" },
  { label: "Phone", pattern: "\\+?\\d{1,3}[-.\\s]?\\d{3,4}[-.\\s]?\\d{4}" },
  { label: "HEX Color", pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b" },
];

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function RegexTester() {
  const t = useTranslations("tools.regexTester");
  const { copy, copied } = useClipboard();
  const [pattern, setPattern] = useState("");
  const [testStr, setTestStr] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({ g: true, i: true, m: false, s: false });
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [highlighted, setHighlighted] = useState("");
  const [error, setError] = useState("");

  const toggleFlag = (flag: string) => {
    const next = { ...flags, [flag]: !flags[flag] };
    setFlags(next);
    runTest(pattern, testStr, next);
  };

  const runTest = useCallback((pat: string, text: string, fl: Record<string, boolean>) => {
    if (!pat || !text) {
      setMatches([]);
      setHighlighted("");
      setError("");
      return;
    }

    try {
      const flagStr = Object.entries(fl).filter(([, v]) => v).map(([k]) => k).join("");
      const regex = new RegExp(pat, flagStr);
      const found: RegexMatch[] = [];

      if (flagStr.includes("g")) {
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          found.push({ value: m[0], index: m.index, groups: m.slice(1) });
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(text);
        if (m) found.push({ value: m[0], index: m.index, groups: m.slice(1) });
      }

      setMatches(found);
      setError("");

      if (found.length > 0) {
        let html = "";
        let lastIdx = 0;
        for (const m of found) {
          html += escapeHtml(text.slice(lastIdx, m.index));
          html += `<mark class="regex-match">${escapeHtml(m.value)}</mark>`;
          lastIdx = m.index + m.value.length;
        }
        html += escapeHtml(text.slice(lastIdx));
        setHighlighted(html);
      } else {
        setHighlighted(escapeHtml(text));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid regex");
      setMatches([]);
      setHighlighted("");
    }
  }, []);

  const handlePattern = (val: string) => {
    setPattern(val);
    runTest(val, testStr, flags);
  };

  const handleTest = (val: string) => {
    setTestStr(val);
    runTest(pattern, val, flags);
  };

  const handlePreset = (preset: string) => {
    setPattern(preset);
    runTest(preset, testStr, flags);
  };

  const copyMatches = () => {
    const text = matches.map((m) => m.value).join("\n");
    if (text) copy(text);
  };

  return (
    <div className="grid gap-4">
      {/* Pattern */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t("patternTitle")}</CardTitle>
            <CardDescription>{t("patternSubtitle")}</CardDescription>
          </div>
          <div className="flex gap-1">
            {["g", "i", "m", "s"].map((f) => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                className={cn(
                  "h-7 w-7 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer",
                  flags[f]
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <input
            value={pattern}
            onChange={(e) => handlePattern(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. \b[A-Z][a-z]+\b"
          />
          {error && <p className="mt-2 text-xs text-red-accent">{error}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <Button key={p.label} variant="outline" size="sm" className="text-xs h-6" onClick={() => handlePreset(p.pattern)}>
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Test string */}
        <Card>
          <CardHeader>
            <CardTitle>{t("testTitle")}</CardTitle>
            <CardDescription>{t("testSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={testStr}
              onChange={(e) => handleTest(e.target.value)}
              className="w-full min-h-[200px] rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter text to test your regex against..."
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t("resultsTitle")}</CardTitle>
              {matches.length > 0 && (
                <CardDescription>{matches.length} match{matches.length !== 1 ? "es" : ""} found</CardDescription>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={copyMatches}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              Copy
            </Button>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-[120px] rounded-lg border border-border bg-input p-3 text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: highlighted || '<span class="text-muted-foreground">Matches will be highlighted here...</span>',
              }}
            />
            {matches.length > 0 && (
              <div className="mt-3 max-h-[160px] overflow-y-auto space-y-1">
                {matches.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-input/50 px-2 py-1 text-xs">
                    <Badge variant="info" className="text-[10px]">{i + 1}</Badge>
                    <code className="font-mono text-green-accent">&quot;{m.value}&quot;</code>
                    <span className="text-muted-foreground">@ index {m.index}</span>
                    {m.groups.length > 0 && (
                      <span className="text-muted-foreground">groups: {m.groups.map((g) => `"${g}"`).join(", ")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

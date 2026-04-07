"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ClipboardCopy, Loader2, ShieldCheck } from "lucide-react";
import { analyzeCode, getReviewHistory, type ReviewHistoryItem } from "@/lib/actions/tools/code-review";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiToolsUpgradeModal } from "@/components/tools/ai-tools-upgrade-modal";
import { cn } from "@/lib/utils";

type FocusArea = "bugs" | "performance" | "security" | "style";

const FOCUS_OPTIONS: { id: FocusArea; label: string }[] = [
  { id: "bugs", label: "Bugs" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
  { id: "style", label: "Style" },
];

const LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Java",
  "C#",
  "Rust",
  "SQL",
];

function gradeClass(grade: string) {
  switch (grade) {
    case "A":
      return "text-emerald-500";
    case "B":
      return "text-green-500";
    case "C":
      return "text-amber-500";
    case "D":
      return "text-orange-500";
    default:
      return "text-red-500";
  }
}

export default function CodeReviewPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([
    "bugs",
    "performance",
    "security",
    "style",
  ]);
  const [report, setReport] = useState<string | null>(null);
  const [grade, setGrade] = useState<"A" | "B" | "C" | "D" | "F" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUpgradePending, startUpgradeTransition] = useTransition();
  const [isTrialPending, startTrialTransition] = useTransition();
  const [copiedReport, setCopiedReport] = useState(false);

  const canSubmit = useMemo(() => code.trim().length >= 10, [code]);

  const copyReport = () => {
    if (!report) return;
    void navigator.clipboard.writeText(report).then(() => {
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 2000);
    });
  };

  const runReview = () => {
    setError(null);
    startTransition(async () => {
      const result = await analyzeCode({ code, language, focusAreas });
      if (!result.success) {
        if (result.upgradeRequired) {
          setShowUpgrade(true);
          return;
        }
        setError(result.error ?? "Review failed");
        return;
      }
      setReport(result.report ?? null);
      setGrade(result.grade ?? null);
    });
  };

  const loadHistory = () => {
    if (historyLoaded) return;
    startTransition(async () => {
      const rows = await getReviewHistory(20);
      setHistory(rows);
      setHistoryLoaded(true);
    });
  };

  const handleUpgrade = () => {
    startUpgradeTransition(async () => {
      const result = await createCheckout("pro");
      if (result?.url) {
        window.location.href = result.url;
      }
    });
  };

  const handleStartTrial = () => {
    startTrialTransition(async () => {
      const result = await startProTrial();
      if (result && "url" in result && result.url) {
        window.location.href = result.url;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">AI Code Reviewer</h1>
        <p className="text-xs text-muted-foreground">
          Paste your code, get a grade (A-F), and receive detailed feedback on bugs, security and performance.
        </p>
      </div>

      <Tabs defaultValue="review" onValueChange={(v) => v === "history" && loadHistory()}>
        <TabsList>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Minimum 10 characters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-muted-foreground">Focus areas</span>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map(({ id, label }) => {
                    const on = focusAreas.includes(id);
                    return (
                      <Button
                        key={id}
                        type="button"
                        size="sm"
                        variant={on ? "default" : "outline"}
                        className={cn("h-8 text-xs", on && "ring-2 ring-primary/30")}
                        onClick={() => {
                          setFocusAreas((prev) => {
                            if (prev.includes(id)) {
                              const next = prev.filter((x) => x !== id);
                              return next.length ? next : prev;
                            }
                            return [...prev, id];
                          });
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code here..."
                className="min-h-[280px] w-full rounded-md border border-input bg-background p-3 font-mono text-xs outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />

              <Button onClick={runReview} disabled={!canSubmit || isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Analyze Code
              </Button>

              {error ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Result</CardTitle>
                <CardDescription>AI review report (markdown)</CardDescription>
              </div>
              {report ? (
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={copyReport}>
                  <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                  {copiedReport ? "Copied" : "Copy report"}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {grade ? (
                <div className={`flex items-center gap-2 text-sm font-semibold ${gradeClass(grade)}`}>
                  <CheckCircle2 className="h-4 w-4" />
                  Grade: {grade}
                </div>
              ) : null}

              {report ? (
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs leading-6">
                  {report}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">No report yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your review history</CardTitle>
              <CardDescription>Recent runs saved to your account history</CardDescription>
            </CardHeader>
            <CardContent>
              {isPending && !historyLoaded ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No saved reviews yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-md border border-border p-2">
                      <p className="text-xs font-medium">{item.summary ?? "Code review entry"}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AiToolsUpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        limitDescription="You reached your daily code review limit. Upgrade to Pro for unlimited AI reviews."
        isUpgradePending={isUpgradePending}
        isTrialPending={isTrialPending}
        onUpgrade={handleUpgrade}
        onTrial={handleStartTrial}
      />
    </div>
  );
}

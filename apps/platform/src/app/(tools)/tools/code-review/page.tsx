"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Crown, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { analyzeCode, getReviewHistory, type ReviewHistoryItem } from "@/lib/actions/tools/code-review";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [report, setReport] = useState<string | null>(null);
  const [grade, setGrade] = useState<"A" | "B" | "C" | "D" | "F" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUpgradePending, startUpgradeTransition] = useTransition();
  const [isTrialPending, startTrialTransition] = useTransition();

  const canSubmit = useMemo(() => code.trim().length >= 10, [code]);

  const runReview = () => {
    setError(null);
    startTransition(async () => {
      const result = await analyzeCode({ code, language });
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
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Structured AI review report</CardDescription>
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
              <CardDescription>Saved from tool_history (`tool_slug = code-review`)</CardDescription>
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

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              Free limit reached
            </DialogTitle>
            <DialogDescription>
              You reached your daily code review limit. Upgrade to Pro for unlimited AI reviews.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpgrade(false)}>
              Later
            </Button>
            <Button onClick={handleStartTrial} disabled={isTrialPending} variant="secondary">
              {isTrialPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Try Pro Free for 7 Days
            </Button>
            <Button onClick={handleUpgrade} disabled={isUpgradePending}>
              {isUpgradePending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TriangleAlert className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

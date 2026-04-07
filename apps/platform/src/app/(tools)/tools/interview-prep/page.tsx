"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardCopy, Loader2, MessageSquareQuote, Save } from "lucide-react";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import {
  evaluateAnswer,
  getInterviewHistory,
  getQuestion,
  saveInterviewSession,
  type InterviewEvalStructured,
  type InterviewHistoryItem,
} from "@/lib/actions/tools/interview";
import {
  CATEGORY_LABELS,
  interviewCategories,
  type InterviewCategory,
} from "@/lib/config/interview-categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiToolsUpgradeModal } from "@/components/tools/ai-tools-upgrade-modal";

type Difficulty = "easy" | "medium" | "hard";

interface Round {
  question: string;
  questionHints?: string[];
  answer: string;
  score: number;
  feedback: string;
  structured?: InterviewEvalStructured;
}

function buildStructuredFeedbackText(s: InterviewEvalStructured): string {
  const lines: string[] = [];
  if (s.strengths.length > 0) {
    lines.push("Strengths:", ...s.strengths.map((x) => `- ${x}`), "");
  }
  if (s.improvements.length > 0) {
    lines.push("Improvements:", ...s.improvements.map((x) => `- ${x}`), "");
  }
  if (s.detailedAnalysis?.trim()) {
    lines.push(s.detailedAnalysis.trim(), "");
  }
  const complexity = [s.timeComplexity && `Time: ${s.timeComplexity}`, s.spaceComplexity && `Space: ${s.spaceComplexity}`]
    .filter(Boolean)
    .join(" · ");
  if (complexity) lines.push(complexity, "");
  if (s.alternativeApproaches && s.alternativeApproaches.length > 0) {
    lines.push("Alternative approaches:", ...s.alternativeApproaches.map((x) => `- ${x}`));
  }
  return lines.join("\n").trim();
}

function buildRoundExport(r: Round, idx: number): string {
  let block = `Round ${idx + 1} — Score ${r.score}\n\nQuestion:\n${r.question}\n\nYour answer:\n${r.answer}\n\n`;
  if (r.structured) {
    block += `Feedback:\n${buildStructuredFeedbackText(r.structured)}`;
  } else {
    block += `Feedback:\n${r.feedback}`;
  }
  return block.trim();
}

function buildSessionExport(
  category: InterviewCategory,
  difficulty: Difficulty,
  rounds: Round[],
  averageScore: number,
): string {
  const header = [
    "AI Interview Prep — exported session",
    `Category: ${CATEGORY_LABELS[category]}`,
    `Difficulty: ${difficulty}`,
    `Rounds: ${rounds.length}`,
    `Average score: ${averageScore}`,
    "",
    "---",
    "",
  ].join("\n");
  return header + rounds.map((r, i) => buildRoundExport(r, i)).join("\n\n---\n\n");
}

export default function InterviewPrepPage() {
  const [category, setCategory] = useState<InterviewCategory>("system-design");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentHints, setCurrentHints] = useState<string[] | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const averageScore = useMemo(() => {
    if (rounds.length === 0) return 0;
    const total = rounds.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / rounds.length);
  }, [rounds]);

  const askNext = () => {
    setError(null);
    startTransition(async () => {
      const res = await getQuestion({ category, difficulty });
      if (!res.success) {
        if (res.upgradeRequired) return setShowUpgrade(true);
        return setError(res.error ?? "Failed to fetch question");
      }
      setCurrentQuestion(res.question ?? null);
      setCurrentHints(res.hints?.length ? res.hints : null);
      setCurrentAnswer("");
    });
  };

  const submitAnswer = () => {
    if (!currentQuestion || currentAnswer.trim().length < 3) return;
    setError(null);
    startTransition(async () => {
      const res = await evaluateAnswer({
        category,
        difficulty,
        question: currentQuestion,
        answer: currentAnswer,
      });
      if (!res.success) {
        if (res.upgradeRequired) return setShowUpgrade(true);
        return setError(res.error ?? "Failed to evaluate answer");
      }
      setRounds((prev) => [
        ...prev,
        {
          question: currentQuestion,
          questionHints: currentHints ?? undefined,
          answer: currentAnswer,
          score: res.score ?? 0,
          feedback: res.feedback ?? "",
          structured: res.structured,
        },
      ]);
      setCurrentQuestion(null);
      setCurrentHints(null);
      setCurrentAnswer("");
    });
  };

  const saveSession = () => {
    if (rounds.length === 0) return;
    startTransition(async () => {
      const summary = `Interview — ${CATEGORY_LABELS[category]} — ${difficulty} — ${rounds.length} Q — avg ${averageScore}`;
      await saveInterviewSession(summary);
    });
  };

  const loadHistory = () => {
    if (historyLoaded) return;
    startTransition(async () => {
      setHistory(await getInterviewHistory(20));
      setHistoryLoaded(true);
    });
  };

  const onUpgrade = () => {
    startUpgrade(async () => {
      const result = await createCheckout("pro");
      if (result?.url) window.location.href = result.url;
    });
  };

  const onTrial = () => {
    startTrial(async () => {
      const result = await startProTrial();
      if (result && "url" in result && result.url) window.location.href = result.url;
    });
  };

  const flashCopy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const questionClipboardText = useMemo(() => {
    if (!currentQuestion) return "";
    if (!currentHints?.length) return currentQuestion;
    const hintBlock = currentHints.map((h, i) => `${i + 1}. ${h}`).join("\n");
    return `${currentQuestion}\n\nHints:\n${hintBlock}`;
  }, [currentQuestion, currentHints]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">AI Interview Prep</h1>
        <p className="text-xs text-muted-foreground">
          Choose category and difficulty, get JSON-backed questions with hints, then structured feedback and scoring.
        </p>
      </div>

      <Tabs defaultValue="session" onValueChange={(v) => v === "history" && loadHistory()}>
        <TabsList>
          <TabsTrigger value="session">Session</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup</CardTitle>
              <CardDescription>Choose your interview configuration</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InterviewCategory)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm md:max-w-xs"
              >
                {interviewCategories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
              <Button className="md:ml-auto" onClick={askNext} disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareQuote className="mr-2 h-4 w-4" />}
                Ask Question
              </Button>
            </CardContent>
          </Card>

          {currentQuestion ? (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="text-base">Current Question</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => flashCopy("question", questionClipboardText)}
                >
                  <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                  {copiedKey === "question" ? "Copied" : "Copy question"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{currentQuestion}</p>
                {currentHints && currentHints.length > 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Hints
                    </p>
                    <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                      {currentHints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Write your answer..."
                  className="min-h-[160px] w-full rounded-md border border-input bg-background p-3 text-xs"
                />
                <Button onClick={submitAnswer} disabled={pending || currentAnswer.trim().length < 3}>
                  Submit Answer
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Session Results</CardTitle>
                <CardDescription>
                  {rounds.length} rounds • Avg score: {averageScore}
                </CardDescription>
              </div>
              {rounds.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => flashCopy("session", buildSessionExport(category, difficulty, rounds, averageScore))}
                >
                  <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                  {copiedKey === "session" ? "Copied" : "Copy session"}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {rounds.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rounds completed yet.</p>
              ) : (
                rounds.map((r, idx) => (
                  <div key={idx} className="space-y-2 rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold">Q{idx + 1} • Score {r.score}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => flashCopy(`round-${idx}`, buildRoundExport(r, idx))}
                      >
                        <ClipboardCopy className="mr-1 h-3 w-3" />
                        {copiedKey === `round-${idx}` ? "Copied" : "Copy round"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.question}</p>
                    {r.structured ? (
                      <div className="space-y-2 text-xs">
                        {r.structured.strengths.length > 0 ? (
                          <div>
                            <p className="font-medium text-emerald-600 dark:text-emerald-400">Strengths</p>
                            <ul className="mt-1 list-inside list-disc text-muted-foreground">
                              {r.structured.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {r.structured.improvements.length > 0 ? (
                          <div>
                            <p className="font-medium text-amber-600 dark:text-amber-400">Improvements</p>
                            <ul className="mt-1 list-inside list-disc text-muted-foreground">
                              {r.structured.improvements.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <p className="text-muted-foreground">{r.structured.detailedAnalysis}</p>
                        {(r.structured.timeComplexity || r.structured.spaceComplexity) ? (
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {r.structured.timeComplexity ? `T: ${r.structured.timeComplexity}` : null}
                            {r.structured.timeComplexity && r.structured.spaceComplexity ? " · " : null}
                            {r.structured.spaceComplexity ? `S: ${r.structured.spaceComplexity}` : null}
                          </p>
                        ) : null}
                        {r.structured.alternativeApproaches && r.structured.alternativeApproaches.length > 0 ? (
                          <div>
                            <p className="font-medium">Alternatives</p>
                            <ul className="mt-1 list-inside list-disc text-muted-foreground">
                              {r.structured.alternativeApproaches.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap rounded bg-muted/30 p-2 text-xs">{r.feedback}</pre>
                    )}
                  </div>
                ))
              )}
              <Button variant="outline" onClick={saveSession} disabled={pending || rounds.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                Save Session
              </Button>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Recent runs saved to your account history</CardDescription>
            </CardHeader>
            <CardContent>
              {pending && !historyLoaded ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="rounded border border-border p-2">
                      <p className="text-xs font-medium">{item.summary ?? "Interview session"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
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
        limitDescription="You reached your free daily interview prep limit."
        isUpgradePending={upgradePending}
        isTrialPending={trialPending}
        onUpgrade={onUpgrade}
        onTrial={onTrial}
      />
    </div>
  );
}

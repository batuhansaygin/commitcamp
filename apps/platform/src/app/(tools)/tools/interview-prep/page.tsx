"use client";

import { useMemo, useState, useTransition } from "react";
import { Crown, Loader2, MessageSquareQuote, Save } from "lucide-react";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import {
  evaluateAnswer,
  getInterviewHistory,
  getQuestion,
  saveInterviewSession,
  type InterviewHistoryItem,
} from "@/lib/actions/tools/interview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Difficulty = "easy" | "medium" | "hard";

interface Round {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export default function InterviewPrepPage() {
  const [topic, setTopic] = useState("system design");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();

  const averageScore = useMemo(() => {
    if (rounds.length === 0) return 0;
    const total = rounds.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / rounds.length);
  }, [rounds]);

  const askNext = () => {
    setError(null);
    startTransition(async () => {
      const res = await getQuestion({ topic, difficulty });
      if (!res.success) {
        if (res.upgradeRequired) return setShowUpgrade(true);
        return setError(res.error ?? "Failed to fetch question");
      }
      setCurrentQuestion(res.question ?? null);
      setCurrentAnswer("");
    });
  };

  const submitAnswer = () => {
    if (!currentQuestion || currentAnswer.trim().length < 3) return;
    setError(null);
    startTransition(async () => {
      const res = await evaluateAnswer({
        topic,
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
          answer: currentAnswer,
          score: res.score ?? 0,
          feedback: res.feedback ?? "",
        },
      ]);
      setCurrentQuestion(null);
      setCurrentAnswer("");
    });
  };

  const saveSession = () => {
    if (rounds.length === 0) return;
    startTransition(async () => {
      const summary = `Interview session - ${topic} - ${difficulty} - ${rounds.length} questions - avg score ${averageScore}`;
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">AI Interview Prep</h1>
        <p className="text-xs text-muted-foreground">Pick topic and difficulty, answer questions, receive instant feedback and scoring.</p>
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
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm md:max-w-xs"
              />
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
              <CardHeader><CardTitle>Current Question</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{currentQuestion}</p>
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
            <CardHeader>
              <CardTitle>Session Results</CardTitle>
              <CardDescription>{rounds.length} rounds • Avg score: {averageScore}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rounds.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rounds completed yet.</p>
              ) : (
                rounds.map((r, idx) => (
                  <div key={idx} className="rounded-md border border-border p-3 space-y-1">
                    <p className="text-xs font-semibold">Q{idx + 1} • Score {r.score}</p>
                    <p className="text-xs text-muted-foreground">{r.question}</p>
                    <pre className="whitespace-pre-wrap rounded bg-muted/30 p-2 text-xs">{r.feedback}</pre>
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
            <CardHeader><CardTitle>History</CardTitle></CardHeader>
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

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400" /> Upgrade required</DialogTitle>
            <DialogDescription>You reached your free daily interview prep limit.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpgrade(false)}>Later</Button>
            <Button onClick={onTrial} disabled={trialPending} variant="secondary">
              {trialPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Try Pro Free for 7 Days
            </Button>
            <Button onClick={onUpgrade} disabled={upgradePending}>
              {upgradePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

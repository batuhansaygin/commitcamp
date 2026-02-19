"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Play,
  Send,
  RotateCcw,
  Lightbulb,
  Lock,
  Timer,
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  Loader2,
  Code2,
  MessageSquare,
  Trophy,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/challenges/difficulty-badge";
import { CategoryBadge } from "@/components/challenges/category-badge";
import { ChallengeLeaderboard } from "@/components/challenges/challenge-leaderboard";
import { SubmissionResultModal } from "@/components/challenges/submission-result-modal";
import { submitSolution, testSolution, toggleChallengeLike } from "@/lib/actions/challenges";
import {
  DIFFICULTY_CONFIG,
  LANGUAGE_LABELS,
  type Challenge,
  type Submission,
  type ChallengeLeaderboardEntry,
} from "@/lib/types/challenges";

// Dynamic import — Monaco must not SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface SolveClientProps {
  challenge: Challenge;
  initialSubmissions: Submission[];
  leaderboard: ChallengeLeaderboardEntry[];
  userId: string;
}

// Map language IDs → Monaco language identifiers
const MONACO_LANG: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  go: "go",
  cpp: "cpp",
  csharp: "csharp",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  kotlin: "kotlin",
  swift: "swift",
};

interface TestResultDisplay {
  test_case_index: number;
  passed: boolean;
  output: string;
  expected: string;
  time_ms: number;
  error?: string;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function SolveClient({
  challenge,
  initialSubmissions,
  leaderboard,
  userId,
}: SolveClientProps) {
  const router = useRouter();

  // ── Editor state ────────────────────────────────────────────────────────────
  const firstLang =
    challenge.supported_languages?.[0] ?? "javascript";
  const [language, setLanguage] = useState<string>(firstLang);
  const [code, setCode] = useState<string>(
    challenge.starter_code?.[firstLang] ?? "// Write your solution here\n"
  );
  const codeRef = useRef(code);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      setCode(challenge.starter_code?.[lang] ?? `// Write your solution in ${lang}\n`);
    },
    [challenge.starter_code]
  );

  // ── Timer ───────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Panel sizing ────────────────────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(42); // % of total width
  const [editorPct, setEditorPct] = useState(62); // % of right panel height
  const [resultsOpen, setResultsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingH = useRef(false);
  const isDraggingV = useRef(false);

  const startDragH = useCallback(() => {
    isDraggingH.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);
  const startDragV = useCallback(() => {
    isDraggingV.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (isDraggingH.current) {
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPct(Math.max(25, Math.min(65, pct)));
      }
      if (isDraggingV.current) {
        const rightRect = containerRef.current
          .querySelector("[data-right-panel]")
          ?.getBoundingClientRect();
        if (rightRect) {
          const pct = ((e.clientY - rightRect.top) / rightRect.height) * 100;
          setEditorPct(Math.max(30, Math.min(85, pct)));
        }
      }
    }
    function onUp() {
      isDraggingH.current = false;
      isDraggingV.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Hints ───────────────────────────────────────────────────────────────────
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [hintPending, setHintPending] = useState<number | null>(null);

  function revealHint(idx: number) {
    setRevealedHints((prev) => new Set(prev).add(idx));
    setHintPending(null);
  }

  // ── Like ────────────────────────────────────────────────────────────────────
  const [liked, setLiked] = useState(challenge.user_liked ?? false);
  const [likesCount, setLikesCount] = useState(challenge.likes_count);

  async function handleLike() {
    setLiked(!liked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    await toggleChallengeLike(challenge.id);
  }

  // ── Test execution ──────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResultDisplay[] | null>(null);
  const [testPassedCount, setTestPassedCount] = useState(0);
  const [testError, setTestError] = useState<string | null>(null);
  const [runType, setRunType] = useState<"run" | "submit">("run");

  // ── Submission modal ────────────────────────────────────────────────────────
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [lastXP, setLastXP] = useState(0);
  const [lastIsFirst, setLastIsFirst] = useState(false);
  const [lastAchievements, setLastAchievements] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function handleRunTests() {
    if (isRunning || isSubmitting) return;
    setIsRunning(true);
    setTestError(null);
    setRunType("run");
    setResultsOpen(true);

    try {
      const result = await testSolution(challenge.id, codeRef.current, language);
      if (result.error) {
        setTestError(result.error);
        setTestResults(null);
      } else {
        setTestResults(result.results as TestResultDisplay[]);
        setTestPassedCount(result.passedCount);
      }
    } catch (e) {
      setTestError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSubmit() {
    if (isRunning || isSubmitting) return;
    setIsSubmitting(true);
    setTestError(null);
    setRunType("submit");
    setResultsOpen(true);

    try {
      const result = await submitSolution(challenge.id, codeRef.current, language);
      if (result.error) {
        setTestError(result.error);
        setTestResults(null);
      } else {
        setTestResults(
          (result.submission?.test_results ?? []) as TestResultDisplay[]
        );
        setTestPassedCount(result.submission?.tests_passed ?? 0);
        setLastSubmission(result.submission);
        setLastXP(result.xpEarned);
        setLastIsFirst(result.isFirstSolve);
        setLastAchievements(result.newAchievements);
        setShowModal(true);
      }
    } catch (e) {
      setTestError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleRunTests();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const diffCfg = DIFFICULTY_CONFIG[challenge.difficulty];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <Link
          href="/challenges"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Challenges</span>
        </Link>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-semibold truncate flex-1">{challenge.title}</h1>
        <DifficultyBadge difficulty={challenge.difficulty} />
        <Separator orientation="vertical" className="h-4" />
        {/* Timer */}
        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span>{formatTimer(elapsed)}</span>
        </div>
        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1 text-sm transition-colors",
            liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          <span>{likesCount}</span>
        </button>
      </div>

      {/* ── Main split layout ─────────────────────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div
          className="flex flex-col overflow-hidden border-r border-border"
          style={{ width: `${leftPct}%` }}
        >
          <Tabs defaultValue="problem" className="flex flex-col h-full">
            <TabsList className="shrink-0 rounded-none border-b border-border bg-background h-10 px-2 justify-start">
              <TabsTrigger value="problem" className="text-xs h-7 rounded-sm">Problem</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs h-7 rounded-sm">
                <Trophy className="h-3 w-3 mr-1" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs h-7 rounded-sm">
                <Code2 className="h-3 w-3 mr-1" />
                Submissions
              </TabsTrigger>
            </TabsList>

            {/* Problem tab */}
            <TabsContent value="problem" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                  {/* Title + stats */}
                  <div>
                    <div className="flex items-start gap-2 flex-wrap mb-2">
                      <DifficultyBadge difficulty={challenge.difficulty} />
                      <CategoryBadge category={challenge.category} />
                      {challenge.is_official && (
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          Official
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {challenge.solved_count} solved
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {challenge.solve_rate}% success
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {challenge.submissions_count} submissions
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap text-foreground"
                      dangerouslySetInnerHTML={{ __html: formatDescription(challenge.description) }}
                    />
                  </div>

                  {/* Examples */}
                  {challenge.examples && challenge.examples.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Examples</h3>
                      <div className="space-y-3">
                        {challenge.examples.map((ex, i) => (
                          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono">
                            <div className="text-muted-foreground mb-0.5">Example {i + 1}</div>
                            <div><span className="text-foreground font-semibold">Input:</span> <span className="text-foreground">{ex.input}</span></div>
                            <div><span className="text-foreground font-semibold">Output:</span> <span className="text-green-500">{ex.output}</span></div>
                            {ex.explanation && (
                              <div className="mt-1 text-muted-foreground italic">{ex.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Constraints */}
                  {challenge.constraints && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Constraints</h3>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap text-foreground">
                        {challenge.constraints}
                      </div>
                    </div>
                  )}

                  {/* XP info */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-primary">Solve to earn:</span>
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">
                        +{challenge.xp_reward} XP
                      </Badge>
                      {challenge.xp_first_solve_bonus > 0 && (
                        <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
                          +{challenge.xp_first_solve_bonus} First Solve
                        </Badge>
                      )}
                      {challenge.xp_speed_bonus_max > 0 && (
                        <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                          +{challenge.xp_speed_bonus_max} Speed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Hints */}
                  {challenge.hints && challenge.hints.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Hints
                      </h3>
                      <div className="space-y-2">
                        {challenge.hints.map((hint, i) => (
                          <div key={i} className="rounded-lg border border-border overflow-hidden">
                            {revealedHints.has(i) ? (
                              <div className="p-3 text-sm text-foreground bg-amber-500/5">
                                <div className="flex items-start gap-2">
                                  <Eye className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                  <span>{hint.text}</span>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setHintPending(i)}
                                className="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Hint {i + 1}</span>
                                </div>
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30">
                                  -{hint.xp_cost} XP
                                </Badge>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {challenge.tags && challenge.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {challenge.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Leaderboard tab */}
            <TabsContent value="leaderboard" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <ChallengeLeaderboard entries={leaderboard} currentUserId={userId} />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Submissions tab */}
            <TabsContent value="submissions" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {initialSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No submissions yet
                    </div>
                  ) : (
                    initialSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className={cn(
                          "rounded-lg border p-3 text-xs",
                          sub.status === "passed"
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border bg-muted/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {sub.status === "passed" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span className="font-medium capitalize">{sub.status}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString("en")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>{sub.tests_passed}/{sub.tests_total} tests</span>
                          <span>{LANGUAGE_LABELS[sub.language as keyof typeof LANGUAGE_LABELS] ?? sub.language}</span>
                          {sub.xp_earned > 0 && (
                            <span className="text-primary">+{sub.xp_earned} XP</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Horizontal drag handle ────────────────────────────────────────── */}
        <div
          className="w-1 cursor-col-resize bg-border hover:bg-primary/40 transition-colors shrink-0 relative group"
          onMouseDown={startDragH}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* ── Right panel (editor + results) ───────────────────────────────── */}
        <div
          data-right-panel
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Editor area */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ height: resultsOpen ? `${editorPct}%` : "calc(100% - 52px)" }}
          >
            {/* Editor toolbar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-[#1e1e1e] shrink-0">
              <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-7 w-44 text-xs bg-[#2d2d2d] border-[#3e3e3e] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(challenge.supported_languages ?? []).map((lang) => (
                    <SelectItem key={lang} value={lang} className="text-xs">
                      {LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS] ?? lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setCode(challenge.starter_code?.[language] ?? "");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Reset to starter code"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Monaco */}
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                language={MONACO_LANG[language] ?? "javascript"}
                value={code}
                theme="vs-dark"
                onChange={(val) => {
                  const v = val ?? "";
                  setCode(v);
                  codeRef.current = v;
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 22,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>

          {/* ── Vertical drag handle ───────────────────────────────────────── */}
          {resultsOpen && (
            <div
              className="h-1 cursor-row-resize bg-border hover:bg-primary/40 transition-colors shrink-0"
              onMouseDown={startDragV}
            />
          )}

          {/* ── Test results panel ─────────────────────────────────────────── */}
          <div
            className={cn(
              "flex flex-col border-t border-border bg-background shrink-0 overflow-hidden transition-all",
              resultsOpen ? "flex-1" : "h-[52px]"
            )}
            style={resultsOpen ? { height: `${100 - editorPct}%` } : undefined}
          >
            {/* Results header */}
            <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
              <button
                onClick={() => setResultsOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium hover:text-foreground text-foreground/80 transition-colors"
              >
                {resultsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
                Test Results
              </button>
              {testResults && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    testPassedCount === testResults.length
                      ? "border-green-500/40 text-green-500"
                      : "border-red-500/40 text-red-500"
                  )}
                >
                  {testPassedCount}/{testResults.length} passed
                </Badge>
              )}
              {(isRunning || isSubmitting) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {isSubmitting ? "Submitting..." : "Running tests..."}
                </div>
              )}
              <div className="flex-1" />
              {/* Action buttons */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleRunTests}
                disabled={isRunning || isSubmitting}
                title="Ctrl+Enter"
              >
                {isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Run
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                title="Ctrl+Shift+Enter"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit
              </Button>
            </div>

            {/* Results content */}
            {resultsOpen && (
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {/* Error display */}
                  {testError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono break-all">
                          {testError}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* No results yet */}
                  {!testResults && !testError && !isRunning && !isSubmitting && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Click <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Run</kbd> to test
                      your code or <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Submit</kbd> to
                      check all tests
                    </div>
                  )}

                  {/* Loading skeleton */}
                  {(isRunning || isSubmitting) && !testResults && (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-10 rounded-lg bg-muted/50 animate-pulse"
                        />
                      ))}
                    </div>
                  )}

                  {/* Test results */}
                  {testResults && (
                    <>
                      {testResults.length > 0 && (
                        <div className="mb-2">
                          <Progress
                            value={(testPassedCount / testResults.length) * 100}
                            className="h-1.5"
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>{testPassedCount} passed</span>
                            <span>{testResults.length - testPassedCount} failed</span>
                          </div>
                        </div>
                      )}
                      <AnimatePresence>
                        {testResults.map((result, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={cn(
                              "rounded-lg border p-2.5 text-xs",
                              result.passed
                                ? "border-green-500/30 bg-green-500/5"
                                : "border-red-500/30 bg-red-500/5"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.passed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                )}
                                <span className="font-medium">
                                  Test {result.test_case_index + 1}
                                  {result.output === "✓ (hidden)" || result.expected === "(hidden)"
                                    ? " (Hidden)"
                                    : ""}
                                </span>
                              </div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(result.time_ms)}
                              </span>
                            </div>
                            {!result.passed && result.expected !== "(hidden)" && (
                              <div className="mt-2 space-y-1 font-mono pl-5">
                                {result.error ? (
                                  <div className="text-red-400">
                                    Error: {result.error.slice(0, 200)}
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <span className="text-muted-foreground">Expected: </span>
                                      <span className="text-green-400">{result.expected.slice(0, 100)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Got: </span>
                                      <span className="text-red-400">{result.output.slice(0, 100)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* ── Hint confirmation dialog ──────────────────────────────────────────── */}
      <Dialog
        open={hintPending !== null}
        onOpenChange={(o) => !o && setHintPending(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Reveal Hint?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Revealing this hint costs{" "}
            <strong className="text-amber-500">
              {hintPending !== null
                ? challenge.hints?.[hintPending]?.xp_cost ?? 0
                : 0}{" "}
              XP
            </strong>
            . Are you sure?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHintPending(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => hintPending !== null && revealHint(hintPending)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Reveal Hint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Submission result modal ───────────────────────────────────────────── */}
      <SubmissionResultModal
        open={showModal}
        onClose={() => setShowModal(false)}
        submission={lastSubmission}
        xpEarned={lastXP}
        isFirstSolve={lastIsFirst}
        newAchievements={lastAchievements}
        onViewLeaderboard={() => {
          setShowModal(false);
        }}
        onNextChallenge={() => {
          setShowModal(false);
          router.push("/challenges");
        }}
      />
    </div>
  );
}

/** Simple HTML conversion for description — handles basic markdown. */
function formatDescription(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (m) => {
      const code = m.replace(/^```\w*\n?/, "").replace(/```$/, "");
      return `<pre class="bg-muted/40 border border-border rounded-md p-3 text-xs font-mono overflow-auto my-2"><code>${escapeHtml(code)}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

"use client";

import { useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ClipboardCopy, Download, Loader2, Sparkles } from "lucide-react";
import { generateReadme, getReadmeHistory, type ReadmeHistoryItem } from "@/lib/actions/tools/readme-gen";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiToolsUpgradeModal } from "@/components/tools/ai-tools-upgrade-modal";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const STACK_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Other",
];

export default function ReadmeGeneratorPage() {
  const [projectName, setProjectName] = useState("My Project");
  const [language, setLanguage] = useState("TypeScript");
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeUsageExamples, setIncludeUsageExamples] = useState(true);
  const [includeApiDocs, setIncludeApiDocs] = useState(false);
  const [input, setInput] = useState("");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReadmeHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();
  const [copiedMd, setCopiedMd] = useState(false);

  const canSubmit = useMemo(() => projectName.trim().length > 1 && input.trim().length >= 10, [projectName, input]);

  const copyMarkdown = () => {
    if (!markdown) return;
    void navigator.clipboard.writeText(markdown).then(() => {
      setCopiedMd(true);
      window.setTimeout(() => setCopiedMd(false), 2000);
    });
  };

  const downloadMarkdown = () => {
    if (!markdown) return;
    const safe =
      projectName
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80) || "README";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateReadme({
        projectName,
        language,
        input,
        includeInstallation,
        includeUsageExamples,
        includeApiDocs,
      });
      if (!result.success) {
        if (result.upgradeRequired) return setShowUpgrade(true);
        return setError(result.error ?? "Generation failed");
      }
      setMarkdown(result.markdown ?? "");
    });
  };

  const loadHistory = () => {
    if (historyLoaded) return;
    startTransition(async () => {
      setHistory(await getReadmeHistory(20));
      setHistoryLoaded(true);
    });
  };

  const handleUpgrade = () => {
    startUpgrade(async () => {
      const result = await createCheckout("pro");
      if (result?.url) window.location.href = result.url;
    });
  };

  const handleTrial = () => {
    startTrial(async () => {
      const result = await startProTrial();
      if (result && "url" in result && result.url) window.location.href = result.url;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">AI README Generator</h1>
        <p className="text-xs text-muted-foreground">Generate production-ready README markdown from your project notes or code snippets.</p>
      </div>

      <Tabs defaultValue="generate" onValueChange={(v) => v === "history" && loadHistory()}>
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Project details or source excerpts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <div className="space-y-1">
                <Label htmlFor="readme-lang" className="text-xs text-muted-foreground">
                  Primary language / stack
                </Label>
                <select
                  id="readme-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {STACK_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground">README sections</p>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="readme-install" className="text-sm font-normal">
                    Installation
                  </Label>
                  <Switch
                    id="readme-install"
                    checked={includeInstallation}
                    onCheckedChange={setIncludeInstallation}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="readme-usage" className="text-sm font-normal">
                    Usage examples
                  </Label>
                  <Switch
                    id="readme-usage"
                    checked={includeUsageExamples}
                    onCheckedChange={setIncludeUsageExamples}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="readme-api" className="text-sm font-normal">
                    API documentation
                  </Label>
                  <Switch id="readme-api" checked={includeApiDocs} onCheckedChange={setIncludeApiDocs} />
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste project description, API info, install steps, or code..."
                className="min-h-[220px] w-full rounded-md border border-input bg-background p-3 text-xs"
              />
              <Button onClick={onGenerate} disabled={!canSubmit || pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate README
              </Button>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Markdown Preview</CardTitle>
                <CardDescription>Rendered output using prose styles</CardDescription>
              </div>
              {markdown ? (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button type="button" variant="outline" size="sm" onClick={copyMarkdown}>
                    <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                    {copiedMd ? "Copied" : "Copy"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={downloadMarkdown}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download .md
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              {markdown ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No generated output yet.</p>
              )}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-md border border-border p-2">
                      <p className="text-xs font-medium">{item.summary ?? "README generation"}</p>
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
        limitDescription="You reached your free daily README generation limit."
        isUpgradePending={upgradePending}
        isTrialPending={trialPending}
        onUpgrade={handleUpgrade}
        onTrial={handleTrial}
      />
    </div>
  );
}

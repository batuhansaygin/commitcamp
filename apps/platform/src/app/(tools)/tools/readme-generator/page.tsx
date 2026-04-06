"use client";

import { useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Crown, Loader2, Sparkles } from "lucide-react";
import { generateReadme, getReadmeHistory, type ReadmeHistoryItem } from "@/lib/actions/tools/readme-gen";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ReadmeGeneratorPage() {
  const [projectName, setProjectName] = useState("My Project");
  const [input, setInput] = useState("");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReadmeHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();

  const canSubmit = useMemo(() => projectName.trim().length > 1 && input.trim().length >= 10, [projectName, input]);

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateReadme({ projectName, input });
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
            <CardHeader>
              <CardTitle>Markdown Preview</CardTitle>
              <CardDescription>Rendered output using prose styles</CardDescription>
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
              <CardDescription>Previous README generation runs</CardDescription>
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

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              Upgrade required
            </DialogTitle>
            <DialogDescription>You reached your free daily README generation limit.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpgrade(false)}>Later</Button>
            <Button onClick={handleTrial} disabled={trialPending} variant="secondary">
              {trialPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Try Pro Free for 7 Days
            </Button>
            <Button onClick={handleUpgrade} disabled={upgradePending}>
              {upgradePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

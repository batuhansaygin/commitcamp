"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardCopy, Loader2, Sparkles } from "lucide-react";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { generateCommitAndPr, getCommitGenHistory, type CommitCandidate, type CommitHistoryItem } from "@/lib/actions/tools/commit-gen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiToolsUpgradeModal } from "@/components/tools/ai-tools-upgrade-modal";
import { Label } from "@/components/ui/label";

function CopyBtn({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      <ClipboardCopy className="mr-1 h-3.5 w-3.5" />
      {copied ? "Copied" : label}
    </Button>
  );
}

type CommitStyle = "conventional" | "simple" | "both";

export default function CommitGeneratorPage() {
  const [changes, setChanges] = useState("");
  const [context, setContext] = useState("");
  const [style, setStyle] = useState<CommitStyle>("both");
  const [options, setOptions] = useState<CommitCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CommitHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();

  const canSubmit = useMemo(() => changes.trim().length >= 10, [changes]);

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateCommitAndPr({
        changes,
        context: context.trim() || undefined,
        style,
      });
      if (!result.success) {
        if (result.upgradeRequired) return setShowUpgrade(true);
        return setError(result.error ?? "Generation failed");
      }
      setOptions(result.options ?? []);
    });
  };

  const loadHistory = () => {
    if (historyLoaded) return;
    startTransition(async () => {
      setHistory(await getCommitGenHistory(20));
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
        <h1 className="text-lg font-bold">AI Commit + PR Generator</h1>
        <p className="text-xs text-muted-foreground">Generate conventional commit and PR descriptions from your diff notes.</p>
      </div>

      <Tabs defaultValue="generate" onValueChange={(v) => v === "history" && loadHistory()}>
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Changes Input</CardTitle>
              <CardDescription>Paste diff or summary of changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={changes}
                onChange={(e) => setChanges(e.target.value)}
                placeholder="git diff output or plain-text summary..."
                className="min-h-[220px] w-full rounded-md border border-input bg-background p-3 text-xs"
              />
              <div className="space-y-1">
                <Label htmlFor="commit-style" className="text-xs text-muted-foreground">
                  Commit message style
                </Label>
                <select
                  id="commit-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as CommitStyle)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="both">Conventional + simple (in PR body)</option>
                  <option value="conventional">Conventional only</option>
                  <option value="simple">Simple (one line, no type prefix)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="commit-context" className="text-xs text-muted-foreground">
                  Extra context (optional)
                </Label>
                <textarea
                  id="commit-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ticket link, product intent, breaking changes…"
                  className="min-h-[80px] w-full rounded-md border border-input bg-background p-3 text-xs"
                />
              </div>
              <Button onClick={onGenerate} disabled={!canSubmit || pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate 3 alternatives
              </Button>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {options.length === 0 ? (
              <p className="text-xs text-muted-foreground">No generated options yet.</p>
            ) : (
              options.map((opt, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-sm">Option {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Commit</p>
                      <div className="rounded border border-border p-2 text-xs font-mono">{opt.commit}</div>
                      <CopyBtn value={opt.commit} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">PR Title</p>
                      <div className="rounded border border-border p-2 text-xs">{opt.prTitle}</div>
                      <CopyBtn value={opt.prTitle} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">PR Description</p>
                      <pre className="whitespace-pre-wrap rounded border border-border p-2 text-xs">{opt.prBody}</pre>
                      <CopyBtn value={opt.prBody} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="rounded border border-border p-2">
                      <p className="text-xs font-medium">{item.summary ?? "Commit generation run"}</p>
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
        limitDescription="You reached your free daily commit generation limit."
        isUpgradePending={upgradePending}
        isTrialPending={trialPending}
        onUpgrade={onUpgrade}
        onTrial={onTrial}
      />
    </div>
  );
}

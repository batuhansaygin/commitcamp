"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRightLeft, ClipboardCopy, Loader2 } from "lucide-react";
import { convertCode, getCodeConvertHistory, getSupportedLanguages, type ConvertHistoryItem } from "@/lib/actions/tools/code-convert";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiToolsUpgradeModal } from "@/components/tools/ai-tools-upgrade-modal";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CodeConverterPage() {
  const [sourceLanguage, setSourceLanguage] = useState("TypeScript");
  const [targetLanguage, setTargetLanguage] = useState("Python");
  const [preserveComments, setPreserveComments] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notes, setNotes] = useState<string[] | null>(null);
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [dependencies, setDependencies] = useState<string[] | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConvertHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();
  const [copiedOut, setCopiedOut] = useState(false);

  const canSubmit = useMemo(() => input.trim().length >= 10 && sourceLanguage !== targetLanguage, [input, sourceLanguage, targetLanguage]);

  const copyOutput = () => {
    if (!output) return;
    void navigator.clipboard.writeText(output).then(() => {
      setCopiedOut(true);
      window.setTimeout(() => setCopiedOut(false), 2000);
    });
  };

  useEffect(() => {
    startTransition(async () => {
      const langs = await getSupportedLanguages();
      setLanguages([...langs]);
    });
  }, []);

  const onConvert = () => {
    setError(null);
    setNotes(null);
    setWarnings(null);
    setDependencies(null);
    startTransition(async () => {
      const result = await convertCode({
        sourceLanguage,
        targetLanguage,
        code: input,
        preserveComments,
      });
      if (!result.success) {
        if (result.upgradeRequired) return setShowUpgrade(true);
        return setError(result.error ?? "Conversion failed");
      }
      setOutput(result.output ?? "");
      setNotes(result.notes ?? null);
      setWarnings(result.warnings ?? null);
      setDependencies(result.dependencies ?? null);
    });
  };

  const loadHistory = () => {
    if (historyLoaded) return;
    startTransition(async () => {
      setHistory(await getCodeConvertHistory(20));
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
        <h1 className="text-lg font-bold">AI Code Converter</h1>
        <p className="text-xs text-muted-foreground">Convert code between languages with idiomatic syntax and style.</p>
      </div>

      <Tabs defaultValue="convert" onValueChange={(v) => v === "history" && loadHistory()}>
        <TabsList>
          <TabsTrigger value="convert">Convert</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Select source and target languages</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {languages.map((lang) => <option key={`src-${lang}`} value={lang}>{lang}</option>)}
                </select>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {languages.map((lang) => <option key={`dst-${lang}`} value={lang}>{lang}</option>)}
                </select>
                <Button className="md:ml-auto" onClick={onConvert} disabled={!canSubmit || pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Convert
              </Button>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                <Label htmlFor="preserve-comments" className="text-sm font-normal">
                  Preserve comments
                </Label>
                <Switch
                  id="preserve-comments"
                  checked={preserveComments}
                  onCheckedChange={setPreserveComments}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Source</CardTitle></CardHeader>
              <CardContent>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[260px] w-full rounded-md border border-input bg-background p-3 font-mono text-xs" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-base">Converted</CardTitle>
                {output ? (
                  <Button type="button" variant="outline" size="sm" onClick={copyOutput}>
                    <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                    {copiedOut ? "Copied" : "Copy"}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                <textarea value={output} readOnly className="min-h-[260px] w-full rounded-md border border-input bg-muted/20 p-3 font-mono text-xs" />
              </CardContent>
            </Card>
          </div>

          {(notes && notes.length > 0) || (warnings && warnings.length > 0) || (dependencies && dependencies.length > 0) ? (
            <div className="grid gap-3 md:grid-cols-3">
              {notes && notes.length > 0 ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                      {notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
              {warnings && warnings.length > 0 ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Warnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-inside list-disc space-y-1 text-xs text-amber-600 dark:text-amber-400">
                      {warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
              {dependencies && dependencies.length > 0 ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 font-mono text-xs">
                      {dependencies.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
                      <p className="text-xs font-medium">{item.summary ?? "Conversion run"}</p>
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
        limitDescription="You reached your free daily code conversion limit."
        isUpgradePending={upgradePending}
        isTrialPending={trialPending}
        onUpgrade={onUpgrade}
        onTrial={onTrial}
      />
    </div>
  );
}

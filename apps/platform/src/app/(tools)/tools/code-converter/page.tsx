"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRightLeft, Crown, Loader2 } from "lucide-react";
import { convertCode, getCodeConvertHistory, getSupportedLanguages, type ConvertHistoryItem } from "@/lib/actions/tools/code-convert";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CodeConverterPage() {
  const [sourceLanguage, setSourceLanguage] = useState("TypeScript");
  const [targetLanguage, setTargetLanguage] = useState("Python");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ConvertHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();
  const [upgradePending, startUpgrade] = useTransition();
  const [trialPending, startTrial] = useTransition();

  const canSubmit = useMemo(() => input.trim().length >= 10 && sourceLanguage !== targetLanguage, [input, sourceLanguage, targetLanguage]);

  useEffect(() => {
    startTransition(async () => {
      const langs = await getSupportedLanguages();
      setLanguages([...langs]);
    });
  }, []);

  const onConvert = () => {
    setError(null);
    startTransition(async () => {
      const result = await convertCode({ sourceLanguage, targetLanguage, code: input });
      if (!result.success) {
        if (result.upgradeRequired) return setShowUpgrade(true);
        return setError(result.error ?? "Conversion failed");
      }
      setOutput(result.output ?? "");
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
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
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
              <CardHeader><CardTitle>Converted</CardTitle></CardHeader>
              <CardContent>
                <textarea value={output} readOnly className="min-h-[260px] w-full rounded-md border border-input bg-muted/20 p-3 font-mono text-xs" />
              </CardContent>
            </Card>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
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

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400" /> Upgrade required</DialogTitle>
            <DialogDescription>You reached your free daily code conversion limit.</DialogDescription>
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

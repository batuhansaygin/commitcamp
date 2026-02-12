"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClipboard } from "@/hooks/use-clipboard";
import { Copy, Check, Trash2, RefreshCw, Hash } from "lucide-react";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function computeHash(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const ALGORITHMS = [
  { name: "SHA-1", algo: "SHA-1" },
  { name: "SHA-256", algo: "SHA-256" },
  { name: "SHA-384", algo: "SHA-384" },
  { name: "SHA-512", algo: "SHA-512" },
] as const;

export function UuidGenerator() {
  const t = useTranslations("tools.uuidGenerator");
  const tc = useTranslations("common");
  const { copy, copied } = useClipboard();
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([generateUUID()]);
  const [history, setHistory] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState("");
  const [hashes, setHashes] = useState<{ name: string; value: string }[]>([]);

  const generate = () => {
    const qty = Math.min(Math.max(count, 1), 100);
    const newUuids = Array.from({ length: qty }, () => generateUUID());
    setUuids(newUuids);
    setHistory((prev) => [...newUuids, ...prev].slice(0, 50));
  };

  const computeAll = async () => {
    if (!hashInput.trim()) return;
    const results = await Promise.all(
      ALGORITHMS.map(async ({ name, algo }) => ({
        name,
        value: await computeHash(hashInput, algo),
      }))
    );
    setHashes(results);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* UUID Generator */}
      <Card>
        <CardHeader>
          <CardTitle>{t("uuidTitle")}</CardTitle>
          <CardDescription>Generate random UUIDs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">{t("quantity")}:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-20 rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={generate}>
              <RefreshCw className="mr-1 h-3 w-3" />
              {tc("generate")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copy(uuids.join("\n"))}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {t("copyAll")}
            </Button>
          </div>
          <div className="min-h-[200px] rounded-lg border border-border bg-input p-3 font-mono text-sm space-y-0.5 overflow-auto max-h-[300px]">
            {uuids.map((uuid, i) => (
              <div
                key={i}
                onClick={() => copy(uuid)}
                className="cursor-pointer rounded px-1 py-0.5 hover:bg-accent transition-colors"
                title="Click to copy"
              >
                {uuid}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hash Generator */}
      <Card>
        <CardHeader>
          <CardTitle>{t("hashTitle")}</CardTitle>
          <CardDescription>Compute hash from text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            className="w-full min-h-[80px] rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter text to hash..."
          />
          <Button size="sm" onClick={computeAll}>
            <Hash className="mr-1 h-3 w-3" />
            {t("computeHashes")}
          </Button>
          <div className="space-y-2">
            {hashes.map((h) => (
              <div key={h.name} className="flex items-center gap-2 rounded-lg border border-border bg-input/50 p-2">
                <Badge variant="info" className="shrink-0">{h.name}</Badge>
                <code className="flex-1 break-all font-mono text-[11px] text-muted-foreground">{h.value}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copy(h.value)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("historyTitle")}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
              <Trash2 className="mr-1 h-3 w-3" />
              {tc("clear")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[150px] overflow-y-auto font-mono text-xs text-muted-foreground space-y-0.5">
              {history.map((u, i) => (
                <div key={i} className="opacity-70">{u}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { highlightJSON } from "@/lib/syntax";
import { Copy, Check, Trash2, FileCode } from "lucide-react";

export function JsonFormatter() {
  const t = useTranslations("tools.jsonFormatter");
  const tc = useTranslations("common");
  const { copy, copied } = useClipboard();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputHtml, setOutputHtml] = useState("");
  const [indent, setIndent] = useState(2);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid" | "minified">("idle");

  const format = useCallback(
    (raw: string, spaces: number) => {
      if (!raw.trim()) {
        setOutput("");
        setOutputHtml("");
        setStatus("idle");
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        const formatted = JSON.stringify(parsed, null, spaces);
        setOutput(formatted);
        setOutputHtml(highlightJSON(formatted));
        setStatus("valid");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid JSON";
        setOutput(msg);
        setOutputHtml(`<span class="text-red-accent">${msg}</span>`);
        setStatus("invalid");
      }
    },
    []
  );

  const handleInput = (value: string) => {
    setInput(value);
    format(value, indent);
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setOutputHtml(minified);
      setStatus("minified");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setOutput(msg);
      setOutputHtml(`<span class="text-red-accent">${msg}</span>`);
      setStatus("invalid");
    }
  };

  const handleSample = () => {
    const sample = JSON.stringify(
      {
        name: "CommitCamp",
        version: "2.0.0",
        tools: ["JSON Formatter", "Regex Tester", "Base64 Encoder"],
        settings: { theme: "dark", language: "en" },
        isAwesome: true,
        contributors: null,
      }
    );
    setInput(sample);
    format(sample, indent);
  };

  const handleIndentChange = (value: string) => {
    const spaces = parseInt(value);
    setIndent(spaces);
    format(input, spaces);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t("inputTitle")}</CardTitle>
            <CardDescription>{t("inputSubtitle")}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleSample}>
              <FileCode className="mr-1 h-3 w-3" />
              {tc("sample")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setInput(""); setOutput(""); setOutputHtml(""); setStatus("idle"); }}>
              <Trash2 className="mr-1 h-3 w-3" />
              {tc("clear")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            className="w-full min-h-[380px] rounded-lg border border-border bg-input p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder='{"name": "CommitCamp", "version": 1}'
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <CardTitle>{t("outputTitle")}</CardTitle>
            {status === "valid" && <Badge variant="success">✓ Valid JSON</Badge>}
            {status === "minified" && <Badge variant="success">✓ Minified</Badge>}
            {status === "invalid" && <Badge variant="destructive">✕ Invalid</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Tabs value={String(indent)} onValueChange={handleIndentChange}>
              <TabsList>
                <TabsTrigger value="2">2 sp</TabsTrigger>
                <TabsTrigger value="4">4 sp</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="secondary" size="sm" onClick={handleMinify}>
              {tc("minify")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copy(output)}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? tc("copied") : tc("copy")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="w-full min-h-[380px] rounded-lg border border-border bg-input p-3 font-mono text-sm overflow-auto whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: outputHtml || '<span class="text-muted-foreground">Output will appear here...</span>',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

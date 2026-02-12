"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { Copy, Check, RefreshCw } from "lucide-react";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "pellentesque", "habitant",
  "morbi", "tristique", "senectus", "netus", "fames", "ac", "turpis", "egestas",
  "vestibulum", "tortor", "quam", "feugiat", "vitae", "ultricies", "sem",
  "augue", "blandit", "volutpat", "maecenas", "accumsan", "lacus", "vel",
  "facilisis", "at", "vero", "eos", "accusamus", "iusto", "odio", "dignissimos",
  "ducimus", "blanditiis", "praesentium", "voluptatum", "deleniti", "atque",
  "corrupti", "quos", "dolores", "quas", "molestias", "recusandae",
];

function randomWord() {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function generateSentence() {
  const len = 8 + Math.floor(Math.random() * 12);
  const words = Array.from({ length: len }, () => randomWord());
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function generateParagraph() {
  const sentenceCount = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: sentenceCount }, () => generateSentence()).join(" ");
}

type LoremType = "paragraphs" | "sentences" | "words";

export function LoremGenerator() {
  const t = useTranslations("tools.loremGenerator");
  const tc = useTranslations("common");
  const { copy, copied } = useClipboard();
  const [type, setType] = useState<LoremType>("paragraphs");
  const [count, setCount] = useState(3);
  const [useHtml, setUseHtml] = useState(false);
  const [startClassic, setStartClassic] = useState(true);
  const [output, setOutput] = useState("");

  const generate = useCallback(() => {
    let result = "";
    switch (type) {
      case "paragraphs": {
        const paragraphs = Array.from({ length: count }, () => generateParagraph());
        if (startClassic && paragraphs.length > 0) {
          paragraphs[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + paragraphs[0];
        }
        result = useHtml
          ? paragraphs.map((p) => `<p>${p}</p>`).join("\n\n")
          : paragraphs.join("\n\n");
        break;
      }
      case "sentences": {
        const sentences = Array.from({ length: count }, () => generateSentence());
        if (startClassic && sentences.length > 0) {
          sentences[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
        }
        result = sentences.join(" ");
        break;
      }
      case "words": {
        const words = Array.from({ length: count }, () => randomWord());
        if (startClassic && words.length > 0) {
          words[0] = "lorem";
          if (words.length > 1) words[1] = "ipsum";
          if (words.length > 2) words[2] = "dolor";
        }
        result = words.join(" ");
        break;
      }
    }
    setOutput(result);
  }, [type, count, useHtml, startClassic]);

  const wordCount = output ? output.split(/\s+/).filter(Boolean).length : 0;
  const charCount = output.length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Type</label>
            <Tabs value={type} onValueChange={(v) => setType(v as LoremType)}>
              <TabsList>
                <TabsTrigger value="paragraphs">{t("paragraphs")}</TabsTrigger>
                <TabsTrigger value="sentences">{t("sentences")}</TabsTrigger>
                <TabsTrigger value="words">{t("words")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Quantity: <span className="text-foreground font-semibold">{count}</span>
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={useHtml} onChange={(e) => setUseHtml(e.target.checked)} className="rounded" />
            {t("wrapHtml")}
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={startClassic} onChange={(e) => setStartClassic(e.target.checked)} className="rounded" />
            {t("startClassic")}
          </label>

          <div className="flex gap-2">
            <Button onClick={generate}>
              <RefreshCw className="mr-1 h-3 w-3" />
              {tc("generate")}
            </Button>
            <Button variant="secondary" onClick={() => copy(output)}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
              {copied ? tc("copied") : tc("copy")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("outputTitle")}</CardTitle>
          {output && (
            <CardDescription>{wordCount} words · {charCount} characters</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="min-h-[350px] rounded-lg border border-border bg-input p-3 text-sm leading-relaxed whitespace-pre-wrap overflow-auto">
            {output || <span className="text-muted-foreground">Click Generate to create lorem ipsum text...</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

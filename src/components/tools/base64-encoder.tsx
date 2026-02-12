"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { Copy, Check, Trash2, ArrowRight, ArrowLeft } from "lucide-react";

export function Base64Encoder() {
  const t = useTranslations("tools.base64Encoder");
  const tc = useTranslations("common");
  const { copy, copied } = useClipboard();

  // Base64 state
  const [b64Input, setB64Input] = useState("");
  const [b64Output, setB64Output] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);

  // URL encode state
  const [urlInput, setUrlInput] = useState("");
  const [urlOutput, setUrlOutput] = useState("");

  const b64Encode = () => {
    try {
      let encoded = btoa(unescape(encodeURIComponent(b64Input)));
      if (urlSafe) {
        encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      setB64Output(encoded);
    } catch (e) {
      setB64Output(`Error: ${e instanceof Error ? e.message : "Encoding failed"}`);
    }
  };

  const b64Decode = () => {
    try {
      let input = b64Output.replace(/-/g, "+").replace(/_/g, "/");
      while (input.length % 4) input += "=";
      setB64Input(decodeURIComponent(escape(atob(input))));
    } catch (e) {
      setB64Input(`Error: ${e instanceof Error ? e.message : "Decoding failed"}`);
    }
  };

  const urlEncode = () => {
    setUrlOutput(encodeURIComponent(urlInput));
  };

  const urlDecode = () => {
    try {
      setUrlInput(decodeURIComponent(urlOutput));
    } catch (e) {
      setUrlInput(`Error: ${e instanceof Error ? e.message : "Decoding failed"}`);
    }
  };

  return (
    <Tabs defaultValue="base64">
      <TabsList className="mb-4">
        <TabsTrigger value="base64">Base64</TabsTrigger>
        <TabsTrigger value="url">URL Encode</TabsTrigger>
      </TabsList>

      <TabsContent value="base64">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t("plainText")}</CardTitle>
                <CardDescription>Enter text to encode</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="default" size="sm" onClick={b64Encode}>
                  {tc("encode")} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setB64Input(""); setB64Output(""); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                className="w-full min-h-[250px] rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter plain text here..."
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlSafe}
                  onChange={(e) => setUrlSafe(e.target.checked)}
                  className="rounded"
                />
                {t("urlSafe")}
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t("encoded")}</CardTitle>
                <CardDescription>Base64 output</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="default" size="sm" onClick={b64Decode}>
                  <ArrowLeft className="mr-1 h-3 w-3" /> {tc("decode")}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => copy(b64Output)}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={b64Output}
                onChange={(e) => setB64Output(e.target.value)}
                className="w-full min-h-[250px] rounded-lg border border-border bg-input p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Base64 output will appear here..."
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="url">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t("plainText")}</CardTitle>
                <CardDescription>Enter text or URL to encode</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="default" size="sm" onClick={urlEncode}>
                  {tc("encode")} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setUrlInput(""); setUrlOutput(""); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full min-h-[250px] rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter text or URL here..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t("encoded")}</CardTitle>
                <CardDescription>URL-encoded output</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="default" size="sm" onClick={urlDecode}>
                  <ArrowLeft className="mr-1 h-3 w-3" /> {tc("decode")}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => copy(urlOutput)}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={urlOutput}
                onChange={(e) => setUrlOutput(e.target.value)}
                className="w-full min-h-[250px] rounded-lg border border-border bg-input p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="URL-encoded output will appear here..."
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

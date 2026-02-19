"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClipboard } from "@/hooks/use-clipboard";
import { highlightJSON } from "@/lib/syntax";
import { Copy, Check, Trash2, FileCode } from "lucide-react";

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return decodeURIComponent(
    atob(s).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
}

interface DecodedJwt {
  header: string;
  headerHtml: string;
  payload: string;
  payloadHtml: string;
  signature: string;
  expiry: { expired: boolean; date: Date } | null;
}

export function JwtDecoder() {
  const t = useTranslations("tools.jwtDecoder");
  const tc = useTranslations("common");
  const { copy, copied } = useClipboard();
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState("");

  const decode = useCallback((token: string) => {
    if (!token.trim()) {
      setDecoded(null);
      setError("");
      return;
    }

    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      setError("Invalid JWT format (expected 3 parts separated by dots)");
      setDecoded(null);
      return;
    }

    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const headerStr = JSON.stringify(header, null, 2);
      const payloadStr = JSON.stringify(payload, null, 2);

      let expiry: DecodedJwt["expiry"] = null;
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        expiry = { expired: expDate < new Date(), date: expDate };
      }

      setDecoded({
        header: headerStr,
        headerHtml: highlightJSON(headerStr),
        payload: payloadStr,
        payloadHtml: highlightJSON(payloadStr),
        signature: parts[2],
        expiry,
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decode");
      setDecoded(null);
    }
  }, []);

  const handleSample = () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
    const payload = btoa(
      JSON.stringify({
        sub: "1234567890",
        name: "Batuhan Developer",
          email: "dev@commitcamp.com",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).replace(/=/g, "");
    const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const token = `${header}.${payload}.${sig}`;
    setInput(token);
    decode(token);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t("tokenTitle")}</CardTitle>
            <CardDescription>{t("tokenSubtitle")}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleSample}>
              <FileCode className="mr-1 h-3 w-3" />
              {tc("sample")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setInput(""); setDecoded(null); setError(""); }}>
              <Trash2 className="mr-1 h-3 w-3" />
              {tc("clear")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); decode(e.target.value); }}
            className="w-full min-h-[100px] rounded-lg border border-border bg-input p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />
          {error && <Badge variant="destructive" className="mt-2">✕ {error}</Badge>}
          {decoded && <Badge variant="success" className="mt-2">✓ Valid JWT structure</Badge>}
        </CardContent>
      </Card>

      {decoded && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Header */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-red-accent">{t("header")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(decoded.header)}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg border border-border bg-input p-3 font-mono text-xs overflow-auto whitespace-pre"
                dangerouslySetInnerHTML={{ __html: decoded.headerHtml }}
              />
            </CardContent>
          </Card>

          {/* Payload */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-purple-accent">{t("payload")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(decoded.payload)}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg border border-border bg-input p-3 font-mono text-xs overflow-auto whitespace-pre"
                dangerouslySetInnerHTML={{ __html: decoded.payloadHtml }}
              />
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-cyan-accent">{t("signature")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-input p-3 font-mono text-xs break-all text-muted-foreground">
                {decoded.signature}
              </div>
              {decoded.expiry ? (
                <div>
                  <Badge variant={decoded.expiry.expired ? "destructive" : "success"}>
                    {decoded.expiry.expired ? `✕ ${t("expired")}` : `✓ ${t("valid")}`}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expires: {decoded.expiry.date.toLocaleString()}
                  </p>
                </div>
              ) : (
                <Badge variant="warning">{t("noExpiry")}</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

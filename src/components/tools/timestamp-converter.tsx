"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

export function TimestampConverter() {
  const t = useTranslations("tools.timestampConverter");
  const tc = useTranslations("common");
  const { copy } = useClipboard();

  const [liveUnix, setLiveUnix] = useState("");
  const [liveIso, setLiveIso] = useState("");
  const [liveLocal, setLiveLocal] = useState("");

  const [unit, setUnit] = useState<"s" | "ms">("s");
  const [unixInput, setUnixInput] = useState("");
  const [humanResult, setHumanResult] = useState<{
    local: string;
    iso: string;
    utc: string;
    relative: string;
  } | null>(null);

  const [dateInput, setDateInput] = useState("");
  const [unixResult, setUnixResult] = useState<{
    seconds: string;
    milliseconds: string;
    iso: string;
  } | null>(null);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveUnix(String(Math.floor(now.getTime() / 1000)));
      setLiveIso(now.toISOString());
      setLiveLocal(now.toLocaleString());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Default date input
  useEffect(() => {
    setDateInput(new Date().toISOString().slice(0, 16));
  }, []);

  const convertToHuman = useCallback(() => {
    const val = parseInt(unixInput);
    if (isNaN(val)) return;
    const ms = unit === "s" ? val * 1000 : val;
    const date = new Date(ms);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const absDiff = Math.abs(diff);

    let relative: string;
    if (absDiff < 60000) relative = "just now";
    else if (absDiff < 3600000) relative = `${Math.floor(absDiff / 60000)} minutes ${diff > 0 ? "ago" : "from now"}`;
    else if (absDiff < 86400000) relative = `${Math.floor(absDiff / 3600000)} hours ${diff > 0 ? "ago" : "from now"}`;
    else relative = `${Math.floor(absDiff / 86400000)} days ${diff > 0 ? "ago" : "from now"}`;

    setHumanResult({
      local: date.toLocaleString(),
      iso: date.toISOString(),
      utc: date.toUTCString(),
      relative,
    });
  }, [unixInput, unit]);

  const convertToUnix = useCallback(() => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return;
    setUnixResult({
      seconds: String(Math.floor(date.getTime() / 1000)),
      milliseconds: String(date.getTime()),
      iso: date.toISOString(),
    });
  }, [dateInput]);

  // Auto-convert on input
  useEffect(() => {
    if (unixInput) convertToHuman();
  }, [unixInput, unit, convertToHuman]);

  return (
    <div className="space-y-4">
      {/* Live Clock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("currentTime")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-input p-3 cursor-pointer" onClick={() => copy(liveUnix)}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Unix Timestamp</p>
              <p className="font-mono text-lg text-cyan-accent">{liveUnix}</p>
            </div>
            <div className="rounded-lg border border-border bg-input p-3 cursor-pointer" onClick={() => copy(liveIso)}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">ISO 8601</p>
              <p className="font-mono text-sm text-green-accent">{liveIso}</p>
            </div>
            <div className="rounded-lg border border-border bg-input p-3 cursor-pointer" onClick={() => copy(liveLocal)}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Local Time</p>
              <p className="font-mono text-sm text-purple-accent">{liveLocal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unix → Human */}
        <Card>
          <CardHeader>
            <CardTitle>{t("unixToHuman")}</CardTitle>
            <CardDescription>Convert Unix timestamp to readable date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                value={unixInput}
                onChange={(e) => setUnixInput(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-input px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. 1707753600"
              />
              <Button variant="secondary" size="sm" onClick={() => {
                const now = unit === "s" ? Math.floor(Date.now() / 1000) : Date.now();
                setUnixInput(String(now));
              }}>
                {t("now")}
              </Button>
            </div>
            <Tabs value={unit} onValueChange={(v) => setUnit(v as "s" | "ms")}>
              <TabsList>
                <TabsTrigger value="s">{t("seconds")}</TabsTrigger>
                <TabsTrigger value="ms">{t("milliseconds")}</TabsTrigger>
              </TabsList>
            </Tabs>
            {humanResult && (
              <div className="space-y-2 rounded-lg border border-border bg-input p-3 text-sm">
                <div><span className="text-muted-foreground">Local:</span> <span className="font-mono">{humanResult.local}</span></div>
                <div><span className="text-muted-foreground">ISO:</span> <span className="font-mono text-green-accent">{humanResult.iso}</span></div>
                <div><span className="text-muted-foreground">UTC:</span> <span className="font-mono">{humanResult.utc}</span></div>
                <div><span className="text-muted-foreground">Relative:</span> <Badge variant="info" className="ml-1">{humanResult.relative}</Badge></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Human → Unix */}
        <Card>
          <CardHeader>
            <CardTitle>{t("humanToUnix")}</CardTitle>
            <CardDescription>Convert date to Unix timestamp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={convertToUnix}>
              {tc("convert")} <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
            {unixResult && (
              <div className="space-y-2 rounded-lg border border-border bg-input p-3 text-sm">
                <div className="cursor-pointer" onClick={() => copy(unixResult.seconds)}>
                  <span className="text-muted-foreground">{t("seconds")}:</span>{" "}
                  <span className="font-mono text-cyan-accent">{unixResult.seconds}</span>
                </div>
                <div className="cursor-pointer" onClick={() => copy(unixResult.milliseconds)}>
                  <span className="text-muted-foreground">{t("milliseconds")}:</span>{" "}
                  <span className="font-mono text-purple-accent">{unixResult.milliseconds}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ISO:</span>{" "}
                  <span className="font-mono text-green-accent">{unixResult.iso}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


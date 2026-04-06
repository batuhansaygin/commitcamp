"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/lib/i18n";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { applyReferralCode } from "@/lib/actions/referral/referral";

interface SettingsReferralProps {
  inviteUrl: string;
  code: string;
  rewardedCount: number;
  pendingCount: number;
  hasAppliedReferral: boolean;
}

export function SettingsReferral({
  inviteUrl,
  code,
  rewardedCount,
  pendingCount,
  hasAppliedReferral,
}: SettingsReferralProps) {
  const t = useTranslations("settings.referral");
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg(t("copyFailed"));
    }
  };

  const onApply = () => {
    setMsg(null);
    startTransition(async () => {
      const result = await applyReferralCode(inputCode);
      if (result.ok) {
        setMsg(t("applied"));
        setInputCode("");
        router.refresh();
        return;
      }
      setMsg(result.error);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">{t("yourCode")}</p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wide">{code || "—"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={copyLink} disabled={!inviteUrl}>
              {copied ? t("copied") : <><Copy className="mr-1 h-3.5 w-3.5" />{t("copyLink")}</>}
            </Button>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            {t("rewarded")}: <span className="font-semibold text-foreground">{rewardedCount}</span>
          </p>
          <p>
            {t("pending")}: <span className="font-semibold text-foreground">{pendingCount}</span>
          </p>
        </div>

        {!hasAppliedReferral ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("haveCode")}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder={t("codePlaceholder")}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm uppercase"
                maxLength={16}
              />
              <Button type="button" onClick={onApply} disabled={pending || inputCode.trim().length < 4}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("apply")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("alreadyReferred")}</p>
        )}

        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateAllowPrivateMessages, disconnectDiscord } from "@/lib/actions/profiles";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/lib/types/profiles";

interface SettingsMessagingProps {
  profile: Profile;
}

export function SettingsMessaging({ profile }: SettingsMessagingProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [disconnectPending, setDisconnectPending] = useState(false);
  const allow = profile.allow_private_messages ?? false;
  const discordConnected = Boolean(profile.discord_user_id);

  async function handleSwitch(checked: boolean) {
    setPending(true);
    await updateAllowPrivateMessages(checked);
    setPending(false);
    router.refresh();
  }

  function handleConnectDiscord() {
    window.location.href = "/api/auth/discord";
  }

  async function handleDisconnect() {
    setDisconnectPending(true);
    await disconnectDiscord();
    setDisconnectPending(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("messagingSection")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="allow-pm" className="text-sm font-medium">
              {t("allowPrivateMessages")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("allowPrivateMessagesHint")}
            </p>
          </div>
          <Switch
            id="allow-pm"
            checked={allow}
            onCheckedChange={handleSwitch}
            disabled={pending}
          />
        </div>

        {allow && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("connectDiscordHint")}
            </p>
            {discordConnected ? (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm">
                  {t("discordConnectedAs")}{" "}
                  <strong>{profile.discord_username ?? "Discord"}</strong>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnectPending}
                >
                  {disconnectPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("disconnectDiscord")
                  )}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleConnectDiscord}
                className="w-full sm:w-auto"
              >
                {t("connectDiscord")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

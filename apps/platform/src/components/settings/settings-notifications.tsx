"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateNotificationPreferences } from "@/lib/actions/profile";
import { Bell, Heart, MessageSquare, UserPlus, TrendingUp, Mail } from "lucide-react";

interface NotificationPref {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  level_up: boolean;
}

interface SettingsNotificationsProps {
  preferences: NotificationPref;
}

const NOTIFICATION_ITEMS = [
  {
    key: "likes" as const,
    icon: Heart,
    labelKey: "notif.likes",
    hintKey: "notif.likesHint",
  },
  {
    key: "comments" as const,
    icon: MessageSquare,
    labelKey: "notif.comments",
    hintKey: "notif.commentsHint",
  },
  {
    key: "follows" as const,
    icon: UserPlus,
    labelKey: "notif.follows",
    hintKey: "notif.followsHint",
  },
  {
    key: "level_up" as const,
    icon: TrendingUp,
    labelKey: "notif.levelUp",
    hintKey: "notif.levelUpHint",
  },
] as const;

export function SettingsNotifications({ preferences }: SettingsNotificationsProps) {
  const t = useTranslations("settings");
  const [prefs, setPrefs] = useState<NotificationPref>(preferences);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(key: keyof NotificationPref, value: boolean) {
    setSaving(key);
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await updateNotificationPreferences({ [key]: value });
    setSaving(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t("notif.title")}
        </CardTitle>
        <CardDescription>{t("notif.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATION_ITEMS.map(({ key, icon: Icon, labelKey, hintKey }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <Label htmlFor={`notif-${key}`} className="text-sm font-medium cursor-pointer">
                  {t(labelKey)}
                </Label>
                <p className="text-xs text-muted-foreground">{t(hintKey)}</p>
              </div>
            </div>
            <Switch
              id={`notif-${key}`}
              checked={prefs[key]}
              onCheckedChange={(v) => handleToggle(key, v)}
              disabled={saving === key}
            />
          </div>
        ))}

        {/* Email (coming soon) */}
        <div className="flex items-center justify-between gap-4 opacity-50">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <Label className="text-sm font-medium">{t("notif.email")}</Label>
              <p className="text-xs text-muted-foreground">{t("notif.emailHint")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {t("notif.comingSoon")}
            </span>
            <Switch disabled />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

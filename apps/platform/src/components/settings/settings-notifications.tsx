"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { updateNotificationPreferences } from "@/lib/actions/profile";
import { updateEmailNotificationPreferences } from "@/lib/actions/notifications";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  TrendingUp,
  Mail,
  Smartphone,
} from "lucide-react";

type NotificationKey = "likes" | "comments" | "follows" | "level_up";

interface NotificationPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  level_up: boolean;
}

interface Props {
  pushPreferences: NotificationPrefs;
  emailPreferences: NotificationPrefs;
}

const NOTIFICATION_ITEMS: {
  key: NotificationKey;
  icon: React.ElementType;
  label: string;
  hint: string;
}[] = [
  {
    key: "likes",
    icon: Heart,
    label: "Likes",
    hint: "When someone likes your post or snippet",
  },
  {
    key: "comments",
    icon: MessageSquare,
    label: "Comments",
    hint: "When someone comments on your content",
  },
  {
    key: "follows",
    icon: UserPlus,
    label: "New Followers",
    hint: "When someone starts following you",
  },
  {
    key: "level_up",
    icon: TrendingUp,
    label: "Level Up",
    hint: "When you reach a new level or milestone",
  },
];

function NotificationRow({
  item,
  checked,
  saving,
  onToggle,
}: {
  item: (typeof NOTIFICATION_ITEMS)[0];
  checked: boolean;
  saving: boolean;
  onToggle: (value: boolean) => void;
}) {
  const Icon = item.icon;
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <Label
            htmlFor={`notif-${item.key}`}
            className="cursor-pointer text-sm font-medium"
          >
            {item.label}
          </Label>
          <p className="text-xs text-muted-foreground">{item.hint}</p>
        </div>
      </div>
      <Switch
        id={`notif-${item.key}`}
        checked={checked}
        onCheckedChange={onToggle}
        disabled={saving}
      />
    </div>
  );
}

export function SettingsNotifications({ pushPreferences, emailPreferences }: Props) {
  const [pushPrefs, setPushPrefs] = useState<NotificationPrefs>(pushPreferences);
  const [emailPrefs, setEmailPrefs] = useState<NotificationPrefs>(emailPreferences);
  const [savingPush, setSavingPush] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);

  async function handlePushToggle(key: NotificationKey, value: boolean) {
    setSavingPush(key);
    setPushPrefs((prev) => ({ ...prev, [key]: value }));
    await updateNotificationPreferences({ [key]: value });
    setSavingPush(null);
  }

  async function handleEmailToggle(key: NotificationKey, value: boolean) {
    setSavingEmail(key);
    setEmailPrefs((prev) => ({ ...prev, [key]: value }));
    await updateEmailNotificationPreferences({ [key]: value });
    setSavingEmail(null);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose which events you want to be notified about.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="push">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="push" className="flex-1 gap-2">
              <Smartphone className="h-3.5 w-3.5" />
              In-App
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1 gap-2">
              <Mail className="h-3.5 w-3.5" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* ── In-App / Push tab ── */}
          <TabsContent value="push" className="mt-0">
            <p className="mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
              These control notifications shown within CommitCamp.
            </p>
            <div className="divide-y divide-border">
              {NOTIFICATION_ITEMS.map((item) => (
                <NotificationRow
                  key={item.key}
                  item={item}
                  checked={pushPrefs[item.key]}
                  saving={savingPush === item.key}
                  onToggle={(v) => handlePushToggle(item.key, v)}
                />
              ))}
            </div>
          </TabsContent>

          {/* ── Email tab ── */}
          <TabsContent value="email" className="mt-0">
            <p className="mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
              Beautiful email notifications will be sent to your account email. Disable any type you don&apos;t want.
            </p>
            <div className="divide-y divide-border">
              {NOTIFICATION_ITEMS.map((item) => (
                <NotificationRow
                  key={`email-${item.key}`}
                  item={{ ...item }}
                  checked={emailPrefs[item.key]}
                  saving={savingEmail === item.key}
                  onToggle={(v) => handleEmailToggle(item.key, v)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

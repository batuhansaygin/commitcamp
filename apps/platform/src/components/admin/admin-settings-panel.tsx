"use client";

import { useState, useTransition } from "react";
import { updateSetting, type PlatformSetting } from "@/lib/actions/admin/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShieldCheck,
  Zap,
  FileText,
  Gauge,
  Wrench,
  Loader2,
} from "lucide-react";

const CATEGORY_META: Record<
  PlatformSetting["category"],
  { label: string; description: string; icon: React.ElementType }
> = {
  auth: {
    label: "Auth & OAuth",
    description: "Control signup, login methods, and account linking. OAuth toggles sync to Supabase automatically.",
    icon: ShieldCheck,
  },
  features: {
    label: "Features",
    description: "Enable or disable platform features for all users.",
    icon: Zap,
  },
  content: {
    label: "Content Policy",
    description: "Moderation settings and content limits.",
    icon: FileText,
  },
  rate_limits: {
    label: "Rate Limits",
    description: "Maximum allowed actions per user per day.",
    icon: Gauge,
  },
  maintenance: {
    label: "Maintenance",
    description: "Maintenance mode and platform announcements.",
    icon: Wrench,
  },
};

const BOOLEAN_KEYS = new Set([
  "allow_signup",
  "require_email_verification",
  "manual_linking_enabled",
  "oauth_github_enabled",
  "oauth_google_enabled",
  "oauth_discord_enabled",
  "forum_enabled",
  "snippets_enabled",
  "challenges_enabled",
  "leaderboard_enabled",
  "ai_assistant_enabled",
  "achievements_enabled",
  "post_moderation_enabled",
  "snippet_moderation_enabled",
  "maintenance_mode",
]);

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  settings: PlatformSetting[];
}

export function AdminSettingsPanel({ settings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, unknown>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );

  function handleToggle(key: string) {
    const newVal = !localValues[key];
    setLocalValues((prev) => ({ ...prev, [key]: newVal }));
    setError(null);
    setPendingKey(key);
    startTransition(async () => {
      try {
        await updateSetting(key, newVal);
        setSuccess(`"${formatKey(key)}" updated successfully.`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (e) {
        // Revert on error
        setLocalValues((prev) => ({ ...prev, [key]: !newVal }));
        setError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setPendingKey(null);
      }
    });
  }

  function handleNumberChange(key: string, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setLocalValues((prev) => ({ ...prev, [key]: num }));
  }

  function handleNumberSave(key: string) {
    setError(null);
    setPendingKey(key);
    startTransition(async () => {
      try {
        await updateSetting(key, localValues[key]);
        setSuccess(`"${formatKey(key)}" updated.`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setPendingKey(null);
      }
    });
  }

  const byCategory = settings.reduce<Record<string, PlatformSetting[]>>(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {}
  );

  const categoryOrder: PlatformSetting["category"][] = [
    "auth",
    "features",
    "content",
    "rate_limits",
    "maintenance",
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          ✓ {success}
        </div>
      )}

      {categoryOrder.map((category) => {
        const items = byCategory[category];
        if (!items || items.length === 0) return null;
        const meta = CATEGORY_META[category];

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <meta.icon className="h-4 w-4 text-primary" />
                {meta.label}
              </CardTitle>
              <CardDescription>{meta.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border rounded-xl border border-border">
                {items.map((setting) => {
                  const isBool = BOOLEAN_KEYS.has(setting.key);
                  const currentValue = localValues[setting.key];
                  const isLoading = pendingKey === setting.key && isPending;

                  return (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {formatKey(setting.key)}
                        </p>
                        {setting.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isBool ? (
                          <button
                            disabled={isPending}
                            onClick={() => handleToggle(setting.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                              currentValue
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 className="absolute left-1/2 h-3 w-3 -translate-x-1/2 animate-spin text-white" />
                            ) : (
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                  currentValue
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={String(currentValue ?? "")}
                              onChange={(e) =>
                                handleNumberChange(setting.key, e.target.value)
                              }
                              onBlur={() => handleNumberSave(setting.key)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleNumberSave(setting.key);
                              }}
                              className="w-24 rounded-lg border border-border bg-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            {isLoading && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

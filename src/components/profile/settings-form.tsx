"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/profiles";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Profile } from "@/lib/types/profiles";

interface SettingsFormProps {
  profile: Profile;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState(updateProfile, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profileSection")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {/* Success */}
          {state.success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t("saved")}
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("username")} *
            </label>
            <input
              id="username"
              name="username"
              required
              minLength={3}
              maxLength={30}
              defaultValue={profile.username}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="username"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("usernameHint")}
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="display_name"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("displayName")}
            </label>
            <input
              id="display_name"
              name="display_name"
              maxLength={50}
              defaultValue={profile.display_name ?? ""}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("displayNamePlaceholder")}
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("bio")}
            </label>
            <textarea
              id="bio"
              name="bio"
              maxLength={300}
              rows={4}
              defaultValue={profile.bio ?? ""}
              className="w-full rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("bioPlaceholder")}
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("saveChanges")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

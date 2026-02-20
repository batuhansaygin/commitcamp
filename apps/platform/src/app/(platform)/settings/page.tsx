import { getTranslations } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/actions/profiles";
import { SettingsAccount } from "@/components/settings/settings-account";
import { SettingsAppearance } from "@/components/settings/settings-appearance";
import { SettingsMessaging } from "@/components/profile/settings-messaging";
import { SettingsNotifications } from "@/components/settings/settings-notifications";
import {
  SettingsLinkedAccounts,
  type SerializedIdentity,
} from "@/components/settings/settings-linked-accounts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — CommitCamp" };

const DEFAULT_NOTIF_PREFS = {
  likes: true,
  comments: true,
  follows: true,
  level_up: true,
};

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/settings`);
  }

  const { data: profile, error } = await getCurrentProfile();

  if (error === "Not authenticated") {
    redirect(`/login?redirect=/settings`);
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("profileLoadError")}
        </p>
      </div>
    );
  }

  // Fetch linked OAuth identities
  const { data: identitiesData } = await supabase.auth.getUserIdentities();
  const identities: SerializedIdentity[] = (identitiesData?.identities ?? []).map(
    (identity) => ({
      identity_id: identity.identity_id,
      provider: identity.provider,
      identity_data: (identity.identity_data ?? {}) as Record<
        string,
        string | boolean | number | null
      >,
      created_at: identity.created_at ?? "",
    })
  );
  const hasPassword = identities.some((i) => i.provider === "email");

  const pushPrefs = { ...DEFAULT_NOTIF_PREFS, ...(profile.notification_preferences ?? {}) };
  const emailPrefs = { ...DEFAULT_NOTIF_PREFS, ...(profile.email_notification_preferences ?? {}) };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account security, linked accounts, and notification preferences.
        </p>
      </div>

      <SettingsAccount email={user.email ?? ""} />
      <SettingsLinkedAccounts
        initialIdentities={identities}
        hasPassword={hasPassword}
      />
      <SettingsNotifications
        pushPreferences={pushPrefs}
        emailPreferences={emailPrefs}
      />
      <SettingsAppearance />
      <SettingsMessaging profile={profile} />
    </div>
  );
}

import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/actions/profiles";
import { SettingsAccount } from "@/components/settings/settings-account";
import { SettingsAppearance } from "@/components/settings/settings-appearance";
import { SettingsMessaging } from "@/components/profile/settings-messaging";
import { SettingsNotifications } from "@/components/settings/settings-notifications";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — CommitCamp" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

const DEFAULT_NOTIFICATION_PREFS = {
  likes: true,
  comments: true,
  follows: true,
  level_up: true,
};

export default async function SettingsPage({ params }: PageProps) {
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

  const notifPrefs = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(profile.notification_preferences ?? {}),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>

      <SettingsAccount email={user.email ?? ""} />
      <SettingsAppearance />
      <SettingsMessaging profile={profile} />
      <SettingsNotifications preferences={notifPrefs} />
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/profile/settings-form";
import { SettingsMessaging } from "@/components/profile/settings-messaging";
import { getCurrentProfile } from "@/lib/actions/profiles";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  const { data: profile, error } = await getCurrentProfile();

  // Only redirect to login when user is not authenticated (avoids middleware sending them to home)
  if (error === "Not authenticated") {
    redirect(`/${locale}/login?redirect=/${locale}/settings`);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <SettingsForm profile={profile} />
      <SettingsMessaging profile={profile} />
    </div>
  );
}

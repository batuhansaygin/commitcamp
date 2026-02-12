import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { SettingsForm } from "@/components/profile/settings-form";
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

  const { data: profile } = await getCurrentProfile();

  if (!profile) {
    redirect(`/${locale}/login?redirect=/${locale}/settings`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton />
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <SettingsForm profile={profile} />
    </div>
  );
}

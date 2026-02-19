import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "CommitCamp Privacy Policy",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("privacyTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("privacyUpdated")}</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm">
          <section>
            <h2 className="text-base font-semibold">{t("privacyCollect")}</h2>
            <p>{t("privacyCollectText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("privacyUse")}</h2>
            <p>{t("privacyUseText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("privacyDiscord")}</h2>
            <p>{t("privacyDiscordText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("privacyRights")}</h2>
            <p>{t("privacyRightsText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("privacyContact")}</h2>
            <p>{t("privacyContactText")}</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

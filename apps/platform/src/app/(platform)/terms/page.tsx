import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "CommitCamp Terms of Service",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: PageProps) {
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("termsTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("termsUpdated")}</p>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm">
          <section>
            <h2 className="text-base font-semibold">{t("termsAccept")}</h2>
            <p>{t("termsAcceptText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("termsService")}</h2>
            <p>{t("termsServiceText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("termsUse")}</h2>
            <p>{t("termsUseText")}</p>
          </section>
          <section>
            <h2 className="text-base font-semibold">{t("termsContact")}</h2>
            <p>{t("termsContactText")}</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

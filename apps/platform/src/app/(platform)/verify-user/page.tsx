import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify User",
  description: "CommitCamp Linked Roles verification",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function VerifyUserPage({ params }: PageProps) {
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("verifyTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t("verifyDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

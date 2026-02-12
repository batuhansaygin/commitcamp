import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Mail, MessageSquareText, Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function MessagesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("messages");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Mail className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium text-sm">{t("noConversations")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("noConversationsDesc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-1 h-4 w-4" />
                {t("openSettings")}
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline" size="sm">
                <MessageSquareText className="mr-1 h-4 w-4" />
                {t("browseProfiles")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

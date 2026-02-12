import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { JsonFormatter } from "@/components/tools/json-formatter";
import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Formatter",
  description: "Format, validate & minify JSON with syntax highlighting. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function JsonFormatterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <JsonFormatterContent />;
}

function JsonFormatterContent() {
  const t = useTranslations("tools.jsonFormatter");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <JsonFormatter />
    </div>
  );
}

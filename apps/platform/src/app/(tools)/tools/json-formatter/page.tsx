import { setRequestLocale } from "@/lib/i18n-server";
import { useTranslations } from "@/lib/i18n";
import { JsonFormatter } from "@/components/tools/json-formatter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Formatter",
  description: "Format, validate & minify JSON with syntax highlighting. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function JsonFormatterPage({ params }: PageProps) {
  return <JsonFormatterContent />;
}

function JsonFormatterContent() {
  const t = useTranslations("tools.jsonFormatter");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <JsonFormatter />
    </div>
  );
}

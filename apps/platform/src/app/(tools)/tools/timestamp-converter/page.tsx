import { setRequestLocale } from "@/lib/i18n-server";
import { useTranslations } from "@/lib/i18n";
import { TimestampConverter } from "@/components/tools/timestamp-converter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timestamp Converter",
  description: "Convert between Unix timestamps and human-readable dates. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TimestampConverterPage({ params }: PageProps) {
  return <TimestampConverterContent />;
}

function TimestampConverterContent() {
  const t = useTranslations("tools.timestampConverter");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <TimestampConverter />
    </div>
  );
}

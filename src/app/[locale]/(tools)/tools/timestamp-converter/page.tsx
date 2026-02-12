import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { TimestampConverter } from "@/components/tools/timestamp-converter";
import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timestamp Converter",
  description: "Convert between Unix timestamps and human-readable dates. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TimestampConverterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TimestampConverterContent />;
}

function TimestampConverterContent() {
  const t = useTranslations("tools.timestampConverter");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <TimestampConverter />
    </div>
  );
}

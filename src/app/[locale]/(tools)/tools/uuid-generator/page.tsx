import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { UuidGenerator } from "@/components/tools/uuid-generator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UUID & Hash Generator",
  description: "Generate UUIDs and compute SHA-1, SHA-256, SHA-512 hashes. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function UuidGeneratorPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <UuidGeneratorContent />;
}

function UuidGeneratorContent() {
  const t = useTranslations("tools.uuidGenerator");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <UuidGenerator />
    </div>
  );
}

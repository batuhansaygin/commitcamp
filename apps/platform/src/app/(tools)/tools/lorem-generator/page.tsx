import { setRequestLocale } from "@/lib/i18n-server";
import { useTranslations } from "@/lib/i18n";
import { LoremGenerator } from "@/components/tools/lorem-generator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator",
  description: "Generate placeholder text in paragraphs, sentences or words. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoremGeneratorPage({ params }: PageProps) {
  return <LoremGeneratorContent />;
}

function LoremGeneratorContent() {
  const t = useTranslations("tools.loremGenerator");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <LoremGenerator />
    </div>
  );
}

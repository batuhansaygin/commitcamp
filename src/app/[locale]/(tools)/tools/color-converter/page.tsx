import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ColorConverter } from "@/components/tools/color-converter";
import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Converter",
  description: "Convert between HEX, RGB & HSL with palette generation. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ColorConverterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ColorConverterContent />;
}

function ColorConverterContent() {
  const t = useTranslations("tools.colorConverter");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <ColorConverter />
    </div>
  );
}

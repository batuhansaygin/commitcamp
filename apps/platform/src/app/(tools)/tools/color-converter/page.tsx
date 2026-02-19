import { setRequestLocale } from "@/lib/i18n-server";
import { useTranslations } from "@/lib/i18n";
import { ColorConverter } from "@/components/tools/color-converter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Converter",
  description: "Convert between HEX, RGB & HSL with palette generation. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ColorConverterPage({ params }: PageProps) {
  return <ColorConverterContent />;
}

function ColorConverterContent() {
  const t = useTranslations("tools.colorConverter");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <ColorConverter />
    </div>
  );
}

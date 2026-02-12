import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Base64Encoder } from "@/components/tools/base64-encoder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base64 / URL Encoder",
  description: "Encode & decode Base64 and URL strings instantly. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Base64EncoderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Base64EncoderContent />;
}

function Base64EncoderContent() {
  const t = useTranslations("tools.base64Encoder");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <Base64Encoder />
    </div>
  );
}

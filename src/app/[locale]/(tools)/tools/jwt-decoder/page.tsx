import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { JwtDecoder } from "@/components/tools/jwt-decoder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JWT Decoder",
  description: "Decode JSON Web Tokens and inspect header, payload & expiry. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function JwtDecoderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <JwtDecoderContent />;
}

function JwtDecoderContent() {
  const t = useTranslations("tools.jwtDecoder");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <JwtDecoder />
    </div>
  );
}

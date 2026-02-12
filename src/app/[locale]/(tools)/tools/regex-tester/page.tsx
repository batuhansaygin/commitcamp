import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { RegexTester } from "@/components/tools/regex-tester";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regex Tester",
  description: "Test regular expressions with real-time match highlighting. Free online tool.",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegexTesterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RegexTesterContent />;
}

function RegexTesterContent() {
  const t = useTranslations("tools.regexTester");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>
      <RegexTester />
    </div>
  );
}

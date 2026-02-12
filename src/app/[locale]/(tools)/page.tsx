import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

/** /tools redirects to JSON Formatter by default. */
export default async function ToolsPage({ params }: ToolsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/tools/json-formatter`);
}

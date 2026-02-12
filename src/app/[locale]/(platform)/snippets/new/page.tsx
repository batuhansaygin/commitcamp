import { setRequestLocale } from "next-intl/server";
import { SnippetForm } from "@/components/snippets/snippet-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Snippet" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewSnippetPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <SnippetForm locale={locale} />
    </div>
  );
}

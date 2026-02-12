import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/snippets/code-block";
import { SnippetActions } from "@/components/snippets/snippet-actions";
import { getSnippetById } from "@/lib/actions/snippets";
import { createClient } from "@/lib/supabase/server";
import { User, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { data } = await getSnippetById(id);
  if (!data) return { title: "Snippet Not Found" };
  return { title: data.title };
}

export default async function SnippetDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("snippets");

  const { data: snippet } = await getSnippetById(id);
  if (!snippet) notFound();

  // Check if current user is the author
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === snippet.user_id;

  const authorName =
    snippet.profiles?.display_name ||
    snippet.profiles?.username ||
    "Anonymous";

  const createdDate = new Date(snippet.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{snippet.title}</h1>
          <Badge variant="secondary">{snippet.language}</Badge>
        </div>

        {snippet.description && (
          <p className="text-sm text-muted-foreground">{snippet.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              {t("by")} <strong className="font-medium text-foreground">{authorName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{createdDate}</span>
          </div>
        </div>
      </div>

      {/* Code */}
      <CodeBlock code={snippet.code} language={snippet.language} />

      {/* Actions (delete button for author) */}
      {isAuthor && <SnippetActions snippetId={snippet.id} />}
    </div>
  );
}

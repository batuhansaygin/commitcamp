import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/snippets/code-block";
import { SnippetActions } from "@/components/snippets/snippet-actions";
import { getSnippetById } from "@/lib/actions/snippets";
import { createClient } from "@/lib/supabase/server";
import { User, Calendar, Lock, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

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
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold leading-tight">{snippet.title}</h1>
          <div className="flex items-center gap-2">
            {isAuthor && (
              <Badge variant={snippet.is_public ? "default" : "secondary"} className="text-[10px]">
                {snippet.is_public ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                {snippet.is_public ? t("everyone") : t("onlyMe")}
              </Badge>
            )}
            <Badge variant="secondary">{snippet.language}</Badge>
          </div>
        </div>

        {snippet.description && (
          <p className="text-sm text-muted-foreground">{snippet.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              {t("by")}{" "}
              {snippet.profiles?.username ? (
                <Link
                  href={`/profile/${snippet.profiles.username}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {authorName}
                </Link>
              ) : (
                <strong className="font-medium text-foreground">{authorName}</strong>
              )}
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
      {isAuthor && (
        <SnippetActions
          snippetId={snippet.id}
          locale={locale}
          isPublic={snippet.is_public}
        />
      )}
    </div>
  );
}

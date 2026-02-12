import { setRequestLocale, getTranslations } from "next-intl/server";
import { BackButton } from "@/components/layout/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { PostCard } from "@/components/forum/post-card";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { getFeedPosts, getFeedSnippets } from "@/lib/actions/feed";
import { Rss, MessageSquareText, Code2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feed" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function FeedPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("feed");

  const [{ data: posts }, { data: snippets }] = await Promise.all([
    getFeedPosts(10),
    getFeedSnippets(10),
  ]);

  const isEmpty = posts.length === 0 && snippets.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Rss className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-sm">{t("emptyTitle")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("emptyDesc")}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/forum">
                <Button variant="outline" size="sm">
                  <MessageSquareText className="mr-1 h-4 w-4" />
                  {t("exploreForum")}
                </Button>
              </Link>
              <Link href="/snippets">
                <Button variant="outline" size="sm">
                  <Code2 className="mr-1 h-4 w-4" />
                  {t("exploreSnippets")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Posts from followed users */}
          {posts.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquareText className="h-4 w-4" />
                {t("recentPosts")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {posts.map((post) => (
                  <PostCard key={post.id} snippet={post} />
                ))}
              </div>
            </section>
          )}

          {/* Snippets from followed users */}
          {snippets.length > 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Code2 className="h-4 w-4" />
                {t("recentSnippets")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {snippets.map((snippet) => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

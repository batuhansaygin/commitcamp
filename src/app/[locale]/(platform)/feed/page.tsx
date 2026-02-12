import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FeedFilterSwitcher } from "@/components/feed/feed-filter-switcher";
import { FeedStream } from "@/components/feed/feed-stream";
import { getFeedPosts, getFeedSnippets, getFollowedUserIds, type FeedMode } from "@/lib/actions/feed";
import { Rss, MessageSquareText, Code2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feed" };

const INITIAL_SIZE = 10;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function FeedPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { filter } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("feed");

  const mode: FeedMode = filter === "following" ? "following" : "all";

  const [{ data: posts }, { data: snippets }, followedIds] = await Promise.all([
    getFeedPosts(INITIAL_SIZE, mode, 0),
    getFeedSnippets(INITIAL_SIZE, mode, 0),
    mode === "following" ? getFollowedUserIds() : Promise.resolve([]),
  ]);

  const isEmpty = posts.length === 0 && snippets.length === 0;

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col min-h-0 w-full">
      {/* Fixed header: title + switcher — stays in place */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <FeedFilterSwitcher currentMode={mode} />
      </div>

      {/* Scrollable area only — fits remaining viewport */}
      <div className="feed-scroll-container flex-1 min-h-0 overflow-y-auto -mx-4 px-4 md:-mx-6 md:px-6">
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
          <FeedStream
            initialPosts={posts}
            initialSnippets={snippets}
            mode={mode}
            followedIds={followedIds}
          />
        )}
      </div>
    </div>
  );
}

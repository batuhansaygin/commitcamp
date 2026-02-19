import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FeedFilterSwitcher } from "@/components/feed/feed-filter-switcher";
import { FeedStream } from "@/components/feed/feed-stream";
import {
  getFeedPosts,
  getFeedSnippets,
  getFollowedUserIds,
  type FeedMode,
} from "@/lib/actions/feed";
import { Rss, MessageSquareText, Code2, Plus, Pencil } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feed" };

const INITIAL_SIZE = 10;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function FeedPage({ params, searchParams }: PageProps) {
  const { filter } = await searchParams;
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
      {/* Fixed header: title + switcher */}
      <div className="shrink-0 flex flex-col gap-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Link href="/forum/new">
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("createPost")}</span>
              <span className="sm:hidden">
                <Pencil className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </div>
        <FeedFilterSwitcher currentMode={mode} />
      </div>

      {/* Scrollable content area */}
      <div className="feed-scroll-container flex-1 min-h-0 overflow-y-auto -mx-4 px-4 md:-mx-6 md:px-6">
        {isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <Rss className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-semibold">{t("emptyTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {t("emptyDesc")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/forum">
                  <Button variant="outline" size="sm">
                    <MessageSquareText className="mr-1.5 h-4 w-4" />
                    {t("exploreForum")}
                  </Button>
                </Link>
                <Link href="/snippets">
                  <Button variant="outline" size="sm">
                    <Code2 className="mr-1.5 h-4 w-4" />
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

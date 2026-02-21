import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Plus, MessageSquareText } from "lucide-react";
import { getPosts } from "@/lib/actions/posts";
import { ForumPostsList } from "@/components/forum/forum-posts-list";
import { ForumTabs } from "@/components/forum/forum-tabs";
import { ForumViewSwitcher } from "@/components/forum/forum-view-switcher";
import { ForumLiveUpdater } from "@/components/forum/forum-live-updater";
import type { PostType } from "@/lib/types/posts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forum" };

type ForumView = "grid" | "flow";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; view?: string }>;
}

export default async function ForumPage({ params, searchParams }: PageProps) {
  const { type, view } = await searchParams;
  const t = await getTranslations("forum");

  const validType =
    type && ["discussion", "question", "showcase"].includes(type)
      ? (type as PostType)
      : undefined;

  const currentView: ForumView =
    view === "grid" ? "grid" : "flow";

  const { data: posts } = await getPosts(validType);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/forum/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> {t("newPost")}
          </Button>
        </Link>
      </div>

      {/* Type filter tabs + view switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ForumTabs activeType={validType} currentView={currentView} />
        <ForumViewSwitcher
          currentView={currentView}
          typeParam={validType}
        />
      </div>

      {/* Real-time banner: new posts notification */}
      <ForumLiveUpdater typeFilter={validType} />

      {/* Posts list — client component handles real-time DELETE filtering */}
      {posts.length > 0 ? (
        <ForumPostsList
          initialPosts={posts}
          variant={currentView}
          readMoreLabel={t("readMore")}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MessageSquareText className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("noPosts")}</p>
            <Link href="/forum/new">
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" /> {t("newPost")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

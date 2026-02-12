import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Plus, MessageSquareText } from "lucide-react";
import { getPosts } from "@/lib/actions/posts";
import { PostCard } from "@/components/forum/post-card";
import { ForumTabs } from "@/components/forum/forum-tabs";
import { ForumViewSwitcher } from "@/components/forum/forum-view-switcher";
import type { PostType } from "@/lib/types/posts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forum" };

type ForumView = "grid" | "flow";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; view?: string }>;
}

export default async function ForumPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { type, view } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("forum");

  const validType =
    type && ["discussion", "question", "showcase"].includes(type)
      ? (type as PostType)
      : undefined;

  const currentView: ForumView =
    view === "flow" ? "flow" : "grid";

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

      {/* Posts list */}
      {posts.length > 0 ? (
        <div
          className={
            currentView === "flow"
              ? "flex flex-col gap-2"
              : "grid gap-4 sm:grid-cols-2"
          }
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              snippet={post}
              variant={currentView}
            />
          ))}
        </div>
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

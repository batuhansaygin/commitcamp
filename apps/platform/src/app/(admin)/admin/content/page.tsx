import { Suspense } from "react";
import {
  listPostsAdmin,
  listSnippetsAdmin,
  listCommentsAdmin,
} from "@/lib/actions/admin/content";
import { AdminContentTabs } from "@/components/admin/admin-content-tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Moderation — Admin",
};

interface PageProps {
  searchParams: Promise<{ tab?: string; search?: string; page?: string }>;
}

async function ContentData({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "posts";
  const search = params.search ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const [postsData, snippetsData, commentsData] = await Promise.all([
    listPostsAdmin(search, limit, offset),
    listSnippetsAdmin(search, limit, offset),
    listCommentsAdmin(limit, offset),
  ]);

  return (
    <AdminContentTabs
      posts={postsData.posts}
      postsTotal={postsData.total}
      snippets={snippetsData.snippets}
      snippetsTotal={snippetsData.total}
      comments={commentsData.comments}
      commentsTotal={commentsData.total}
      activeTab={tab}
      page={page}
      limit={limit}
      search={search}
    />
  );
}

export default function AdminContentPage(props: PageProps) {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review and moderate forum posts, snippets, and comments.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading content…</p>
            </CardContent>
          </Card>
        }
      >
        <ContentData {...props} />
      </Suspense>
    </div>
  );
}

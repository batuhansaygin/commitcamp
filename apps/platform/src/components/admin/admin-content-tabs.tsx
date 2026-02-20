"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { deletePost, deleteSnippet, deleteComment } from "@/lib/actions/admin/content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trash2,
  MessageSquare,
  FileCode,
  MessagesSquare,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const TABS = [
  { id: "posts", label: "Posts", icon: MessageSquare },
  { id: "snippets", label: "Snippets", icon: FileCode },
  { id: "comments", label: "Comments", icon: MessagesSquare },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Author {
  username: string;
  display_name: string | null;
}

interface PostRow {
  id: string;
  title: string;
  type: string;
  is_solved: boolean;
  created_at: string;
  author: Author | Author[] | null;
}

interface SnippetRow {
  id: string;
  title: string;
  language: string;
  is_public: boolean;
  created_at: string;
  author: Author | Author[] | null;
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  author: Author | Author[] | null;
}

interface Props {
  posts: PostRow[];
  postsTotal: number;
  snippets: SnippetRow[];
  snippetsTotal: number;
  comments: CommentRow[];
  commentsTotal: number;
  activeTab: string;
  page: number;
  limit: number;
  search: string;
}

function authorName(author: Author | Author[] | null): string {
  const a = Array.isArray(author) ? author[0] : author;
  return a?.display_name ?? a?.username ?? "Unknown";
}

export function AdminContentTabs(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: TabId;
    label: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(
    (props.activeTab as TabId) || "posts"
  );

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({
      tab: activeTab,
      ...(props.search ? { search: props.search } : {}),
      page: String(props.page),
      ...params,
    });
    router.push(`${pathname}?${sp.toString()}`);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      try {
        if (deleteTarget.type === "posts") await deletePost(deleteTarget.id);
        else if (deleteTarget.type === "snippets") await deleteSnippet(deleteTarget.id);
        else await deleteComment(deleteTarget.id);
        setDeleteTarget(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  const currentTotal =
    activeTab === "posts"
      ? props.postsTotal
      : activeTab === "snippets"
        ? props.snippetsTotal
        : props.commentsTotal;
  const totalPages = Math.ceil(currentTotal / props.limit);

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => {
          const count =
            tab.id === "posts"
              ? props.postsTotal
              : tab.id === "snippets"
                ? props.snippetsTotal
                : props.commentsTotal;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                navigate({ tab: tab.id, page: "1" });
              }}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              defaultValue={props.search}
              placeholder="Search title…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate({
                    search: (e.target as HTMLInputElement).value,
                    page: "1",
                  });
                }
              }}
              className="rounded-lg border border-border bg-input py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Content table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === "posts" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Author</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {props.posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No posts found.
                      </td>
                    </tr>
                  ) : (
                    props.posts.map((post) => (
                      <tr key={post.id} className="hover:bg-muted/30">
                        <td className="max-w-xs px-4 py-3 font-medium truncate">
                          {post.title}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {authorName(post.author)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                            {post.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={isPending}
                            onClick={() =>
                              setDeleteTarget({ id: post.id, type: "posts", label: post.title })
                            }
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "snippets" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Author</th>
                    <th className="px-4 py-3 text-left font-medium">Language</th>
                    <th className="px-4 py-3 text-left font-medium">Visibility</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {props.snippets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No snippets found.
                      </td>
                    </tr>
                  ) : (
                    props.snippets.map((snippet) => (
                      <tr key={snippet.id} className="hover:bg-muted/30">
                        <td className="max-w-xs px-4 py-3 font-medium truncate">
                          {snippet.title}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {authorName(snippet.author)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {snippet.language}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              snippet.is_public
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {snippet.is_public ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(snippet.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={isPending}
                            onClick={() =>
                              setDeleteTarget({
                                id: snippet.id,
                                type: "snippets",
                                label: snippet.title,
                              })
                            }
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "comments" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Content</th>
                    <th className="px-4 py-3 text-left font-medium">Author</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {props.comments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground">
                        No comments found.
                      </td>
                    </tr>
                  ) : (
                    props.comments.map((comment) => (
                      <tr key={comment.id} className="hover:bg-muted/30">
                        <td className="max-w-sm px-4 py-3 text-muted-foreground truncate">
                          {comment.content}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {authorName(comment.author)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={isPending}
                            onClick={() =>
                              setDeleteTarget({
                                id: comment.id,
                                type: "comments",
                                label: comment.content.slice(0, 40),
                              })
                            }
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {props.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={props.page <= 1}
              onClick={() => navigate({ page: String(props.page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={props.page >= totalPages}
              onClick={() => navigate({ page: String(props.page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this {deleteTarget?.type.slice(0, -1)}?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.label}&rdquo; will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

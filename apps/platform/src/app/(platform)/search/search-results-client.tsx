"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/profile/level-badge";
import { TechStackBadge } from "@/components/profile/tech-stack-badge";
import { searchPosts, searchUsers } from "@/lib/actions/search";
import {
  Search,
  User,
  FileText,
  Hash,
  MessageSquare,
  HelpCircle,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { SearchPostResult, SearchUserResult, SearchTagResult, SearchCategory } from "@/lib/types/search";

const TYPE_ICONS: Record<string, React.ElementType> = {
  discussion: MessageSquare,
  showcase:   Layers,
  question:   HelpCircle,
  snippet:    FileText,
};

const TYPE_VARIANTS: Record<string, "default" | "info" | "warning"> = {
  discussion: "default",
  question:   "info",
  showcase:   "warning",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface SearchResultsClientProps {
  initialQuery: string;
  initialTag?: string;
  initialCategory?: SearchCategory;
  initialPosts: SearchPostResult[];
  initialUsers: SearchUserResult[];
  trendingTags: SearchTagResult[];
}

export function SearchResultsClient({
  initialQuery,
  initialTag,
  initialCategory = "all",
  initialPosts,
  initialUsers,
  trendingTags,
}: SearchResultsClientProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery]               = useState(initialQuery);
  const [category, setCategory]         = useState<SearchCategory>(initialCategory);
  const [posts, setPosts]               = useState<SearchPostResult[]>(initialPosts);
  const [users, setUsers]               = useState<SearchUserResult[]>(initialUsers);
  const [isPending, startTransition]    = useTransition();

  const CATEGORIES: { key: SearchCategory; label: string; icon: React.ElementType }[] = [
    { key: "all",   label: t("categories.all"),   icon: Search },
    { key: "users", label: t("categories.users"), icon: User },
    { key: "posts", label: t("categories.posts"), icon: FileText },
    { key: "tags",  label: t("categories.tags"),  icon: Hash },
  ];

  function updateUrl(q: string, cat: SearchCategory, tag?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat !== "all") params.set("type", cat);
    if (tag) params.set("tag", tag);
    const url = `${pathname}?${params.toString()}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(url as any, { scroll: false });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newQuery = (fd.get("q") as string).trim();
    setQuery(newQuery);
    updateUrl(newQuery, category);
    startTransition(async () => {
      const [postsRes, usersRes] = await Promise.all([
        searchPosts(newQuery, category !== "users" && category !== "tags" ? category : undefined),
        searchUsers(newQuery),
      ]);
      setPosts(postsRes.data);
      setUsers(usersRes.data);
    });
  }

  function handleCategoryChange(cat: SearchCategory) {
    setCategory(cat);
    updateUrl(query, cat, initialTag);
    startTransition(async () => {
      const [postsRes, usersRes] = await Promise.all([
        searchPosts(query, cat !== "users" && cat !== "tags" ? cat : undefined, initialTag),
        searchUsers(query),
      ]);
      setPosts(postsRes.data);
      setUsers(usersRes.data);
    });
  }

  const showUsers = category === "all" || category === "users";
  const showPosts = category === "all" || category === "posts";
  const showTags  = category === "all" || category === "tags";

  const uniqueTags = Array.from(
    new Set(posts.flatMap((p) => p.tags))
  ).slice(0, 20);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {query
            ? t("resultsPage.titleWithQuery", { query })
            : t("resultsPage.title")}
        </h1>
        {query && (posts.length + users.length > 0) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("resultsPage.showing", { count: posts.length + users.length })}
          </p>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query}
            placeholder={t("placeholder")}
            className="w-full rounded-lg border border-border bg-input py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("categories.all")}
        </button>
      </form>

      {/* Category tabs */}
      <div className="flex gap-1 border-b border-border">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
              category === key
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
        {/* Main results */}
        <div className="space-y-4">
          {isPending && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          )}

          {!isPending && !query && posts.length === 0 && users.length === 0 && (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
            </div>
          )}

          {!isPending && query && posts.length === 0 && users.length === 0 && (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-medium">{t("empty", { query })}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("emptyDescription")}</p>
            </div>
          )}

          {/* User results */}
          {!isPending && showUsers && users.length > 0 && (
            <div className="space-y-2">
              {category === "all" && (
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <User className="h-4 w-4" />
                  {t("groups.users")}
                </h2>
              )}
              {users.map((u) => {
                const displayName = u.display_name || u.username;
                const initial = displayName.charAt(0).toUpperCase();
                return (
                  <Link key={u.id} href={`/profile/${u.username}`}>
                    <Card className="group transition-colors hover:border-primary/30 hover:bg-muted/30">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent flex items-center justify-center text-sm font-bold text-white">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.username} className="h-full w-full object-cover" />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium group-hover:text-primary transition-colors">
                              {displayName}
                            </span>
                            <LevelBadge level={u.level ?? 1} size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                          {u.tech_stack?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {u.tech_stack.slice(0, 4).map((tech) => (
                                <TechStackBadge key={tech} tech={tech} />
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Post results */}
          {!isPending && showPosts && posts.length > 0 && (
            <div className="space-y-2">
              {category === "all" && users.length > 0 && <div className="pt-2" />}
              {category === "all" && (
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {t("groups.posts")}
                </h2>
              )}
              {posts.map((p) => {
                const Icon = TYPE_ICONS[p.type] ?? FileText;
                return (
                  <Link key={p.id} href={`/forum/${p.id}`}>
                    <Card className="group transition-colors hover:border-primary/30 hover:bg-muted/30">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={TYPE_VARIANTS[p.type] ?? "default"} className="text-[10px]">
                            {p.type}
                          </Badge>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          by @{p.author_username}
                        </p>
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tag results */}
          {!isPending && showTags && uniqueTags.length > 0 && (
            <div className="space-y-2">
              {(category === "all") && (posts.length > 0 || users.length > 0) && <div className="pt-2" />}
              {category === "all" && (
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  {t("groups.tags")}
                </h2>
              )}
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map((tag) => (
                  <Link
                    key={tag}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/search?tag=${encodeURIComponent(tag)}` as any}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: trending tags */}
        {trendingTags.length > 0 && (
          <aside className="hidden lg:block space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <Hash className="h-4 w-4" />
                {t("groups.trendingTags")}
              </h3>
              <div className="space-y-2">
                {trendingTags.slice(0, 10).map(({ tag, post_count }) => (
                  <Link
                    key={tag}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/search?tag=${encodeURIComponent(tag)}` as any}
                    className="flex items-center justify-between text-sm hover:text-primary transition-colors"
                  >
                    <span className="text-muted-foreground">#{tag}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("tagPosts", { count: post_count })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

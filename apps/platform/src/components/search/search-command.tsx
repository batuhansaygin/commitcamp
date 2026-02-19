"use client";

import { useCallback } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "@/i18n/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { LevelBadge } from "@/components/profile/level-badge";
import { TechStackBadge } from "@/components/profile/tech-stack-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/hooks/use-search";
import {
  Search,
  User,
  FileText,
  Hash,
  Clock,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Layers,
  X,
} from "lucide-react";
import type { SearchCategory } from "@/lib/types/search";

const TYPE_ICONS: Record<string, React.ElementType> = {
  discussion: MessageSquare,
  showcase:   Layers,
  question:   HelpCircle,
  snippet:    FileText,
};

const TYPE_COLORS: Record<string, string> = {
  discussion: "text-purple-400",
  showcase:   "text-orange-400",
  question:   "text-yellow-400",
  snippet:    "text-blue-400",
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

const CATEGORIES: { key: SearchCategory; labelKey: string }[] = [
  { key: "all",   labelKey: "categories.all" },
  { key: "users", labelKey: "categories.users" },
  { key: "posts", labelKey: "categories.posts" },
  { key: "tags",  labelKey: "categories.tags" },
];

interface SearchCommandProps {
  /** Trending tags fetched server-side and passed in */
  trendingTags?: { tag: string; post_count: number }[];
}

export function SearchCommand({ trendingTags = [] }: SearchCommandProps) {
  const t = useTranslations("search");
  const router = useRouter();

  const {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    isLoading,
    activeCategory,
    setActiveCategory,
    recentSearches,
    addToRecent,
    clearRecent,
  } = useSearch();

  const navigate = useCallback(
    (href: string, searchQuery?: string) => {
      if (searchQuery) addToRecent(searchQuery);
      setIsOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(href as any);
    },
    [addToRecent, setIsOpen, router]
  );

  const showUsers =
    activeCategory === "all" || activeCategory === "users";
  const showPosts =
    activeCategory === "all" || activeCategory === "posts";
  const showTags =
    activeCategory === "all" || activeCategory === "tags";

  const filteredUsers = showUsers ? (results?.users ?? []) : [];
  const filteredPosts = showPosts ? (results?.posts ?? []) : [];
  const filteredTags  = showTags  ? (results?.tags  ?? []) : [];

  const hasResults =
    filteredUsers.length > 0 || filteredPosts.length > 0 || filteredTags.length > 0;
  const isSearching = query.trim().length >= 2;

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Search input */}
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("placeholder")}
      />

      {/* Category filter tabs */}
      <div className="flex gap-1 border-b border-border px-3 py-2">
        {CATEGORIES.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeCategory === key
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <CommandList>
        {/* ── Loading skeleton ─────────────────────────────── */}
        {isLoading && (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state (not loading, has query, no results) ── */}
        {!isLoading && isSearching && !hasResults && (
          <CommandEmpty>
            <div className="space-y-1">
              <p className="font-medium">{t("empty", { query: query.trim() })}</p>
              <p className="text-xs">{t("emptyDescription")}</p>
            </div>
          </CommandEmpty>
        )}

        {/* ── Default state: recent + trending ─────────────── */}
        {!isSearching && !isLoading && (
          <>
            {recentSearches.length > 0 && (
              <CommandGroup
                heading={
                  <div className="flex items-center justify-between">
                    <span>{t("groups.recentSearches")}</span>
                    <button
                      onClick={clearRecent}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {t("clearRecent")}
                    </button>
                  </div>
                }
              >
                {recentSearches.map((s) => (
                  <CommandItem
                    key={s}
                    value={`recent-${s}`}
                    onSelect={() => setQuery(s)}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{s}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {trendingTags.length > 0 && (
              <>
                {recentSearches.length > 0 && <CommandSeparator />}
                <CommandGroup heading={t("groups.trendingTags")}>
                  <div className="flex flex-wrap gap-1.5 px-2 py-1">
                    {trendingTags.slice(0, 8).map(({ tag }) => (
                      <button
                        key={tag}
                        onClick={() =>
                          navigate(
                            `/search?tag=${encodeURIComponent(tag)}`
                          )
                        }
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </CommandGroup>
              </>
            )}

            {recentSearches.length === 0 && trendingTags.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <Search className="h-8 w-8 opacity-30" />
                <p className="text-sm">{t("placeholder")}</p>
              </div>
            )}
          </>
        )}

        {/* ── Results ───────────────────────────────────────── */}
        {!isLoading && isSearching && hasResults && (
          <>
            {/* Users */}
            {filteredUsers.length > 0 && (
              <CommandGroup heading={t("groups.users")}>
                {filteredUsers.map((u) => {
                  const displayName = u.display_name || u.username;
                  const initial = displayName.charAt(0).toUpperCase();
                  return (
                    <CommandItem
                      key={u.id}
                      value={`user-${u.id}`}
                      onSelect={() => navigate(`/profile/${u.username}`, query)}
                      className="gap-3"
                    >
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent flex items-center justify-center text-xs font-bold text-white">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.username} className="h-full w-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {displayName}
                          </span>
                          <LevelBadge level={u.level ?? 1} size="sm" />
                          {u.tech_stack?.slice(0, 2).map((tech) => (
                            <TechStackBadge key={tech} tech={tech} className="text-[9px] px-1.5 py-0" />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{u.username}
                        </p>
                      </div>
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {filteredUsers.length > 0 && filteredPosts.length > 0 && (
              <CommandSeparator />
            )}

            {/* Posts */}
            {filteredPosts.length > 0 && (
              <CommandGroup heading={t("groups.posts")}>
                {filteredPosts.map((p) => {
                  const Icon = TYPE_ICONS[p.type] ?? FileText;
                  const color = TYPE_COLORS[p.type] ?? "text-muted-foreground";
                  return (
                    <CommandItem
                      key={p.id}
                      value={`post-${p.id}`}
                      onSelect={() => navigate(`/forum/${p.id}`, query)}
                      className="gap-3"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by @{p.author_username}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(p.created_at)}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {filteredPosts.length > 0 && filteredTags.length > 0 && (
              <CommandSeparator />
            )}

            {/* Tags */}
            {filteredTags.length > 0 && (
              <CommandGroup heading={t("groups.tags")}>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.tag}
                    value={`tag-${tag.tag}`}
                    onSelect={() =>
                      navigate(
                        `/search?tag=${encodeURIComponent(tag.tag)}`,
                        query
                      )
                    }
                    className="gap-3"
                  >
                    <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">
                      #{tag.tag}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("tagPosts", { count: tag.post_count })}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* View all results link */}
            {isSearching && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="view-all"
                    onSelect={() =>
                      navigate(
                        `/search?q=${encodeURIComponent(query.trim())}`,
                        query
                      )
                    }
                    className="gap-2 text-primary"
                  >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                      Search all results for &ldquo;{query.trim()}&rdquo;
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>

      {/* Footer hints */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1">↑↓</kbd>
            {t("hints.navigate")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1">↵</kbd>
            {t("hints.open")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border px-1">Esc</kbd>
            {t("hints.close")}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-1 rounded p-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </CommandDialog>
  );
}

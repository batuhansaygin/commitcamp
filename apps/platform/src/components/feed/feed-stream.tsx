"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostCard } from "@/components/forum/post-card";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { getFeedPosts, getFeedSnippets, type FeedMode } from "@/lib/actions/feed";
import { getPostById } from "@/lib/actions/posts";
import { getSnippetById } from "@/lib/actions/snippets";
import { createClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/lib/types/posts";
import type { SnippetWithAuthor } from "@/lib/types/snippets";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

type FeedItem =
  | { type: "post"; data: PostWithAuthor }
  | { type: "snippet"; data: SnippetWithAuthor };

interface RealtimeInsertPayload {
  new: {
    id: string;
    user_id: string;
  };
}

function mergeByDate(
  posts: PostWithAuthor[],
  snippets: SnippetWithAuthor[]
): FeedItem[] {
  const items: FeedItem[] = [
    ...posts.map((p) => ({ type: "post" as const, data: p })),
    ...snippets.map((s) => ({ type: "snippet" as const, data: s })),
  ];
  items.sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  );
  return items;
}

interface FeedStreamProps {
  initialPosts: PostWithAuthor[];
  initialSnippets: SnippetWithAuthor[];
  mode: FeedMode;
  followedIds?: string[];
}

export function FeedStream({
  initialPosts,
  initialSnippets,
  mode,
  followedIds = [],
}: FeedStreamProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [snippets, setSnippets] = useState<SnippetWithAuthor[]>(initialSnippets);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Keep knownIdsRef in sync with every state update (not just initial render)
  useEffect(() => {
    posts.forEach((p) => knownIdsRef.current.add(`post-${p.id}`));
  }, [posts]);

  useEffect(() => {
    snippets.forEach((s) => knownIdsRef.current.add(`snippet-${s.id}`));
  }, [snippets]);

  const items = useMemo(
    () => mergeByDate(posts, snippets),
    [posts, snippets]
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const [postsRes, snippetsRes] = await Promise.all([
      getFeedPosts(PAGE_SIZE, mode, posts.length),
      getFeedSnippets(PAGE_SIZE, mode, snippets.length),
    ]);
    const newPosts = (postsRes.data ?? []).filter(
      (p) => !knownIdsRef.current.has(`post-${p.id}`)
    );
    const newSnippets = (snippetsRes.data ?? []).filter(
      (s) => !knownIdsRef.current.has(`snippet-${s.id}`)
    );
    if (newPosts.length > 0) setPosts((p) => [...p, ...newPosts]);
    if (newSnippets.length > 0) setSnippets((s) => [...s, ...newSnippets]);
    if (newPosts.length < PAGE_SIZE && newSnippets.length < PAGE_SIZE) {
      setHasMore(false);
    }
    setLoading(false);
  }, [loading, hasMore, mode, posts.length, snippets.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: el.closest(".feed-scroll-container") ?? null, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Realtime: new posts and snippets appear without refresh
  useEffect(() => {
    const supabase = createClient();
    const addPost = async (id: string, userId: string) => {
      if (mode === "following" && !followedIds.includes(userId)) return;
      if (knownIdsRef.current.has(`post-${id}`)) return;
      const { data } = await getPostById(id);
      if (data) {
        knownIdsRef.current.add(`post-${id}`);
        setPosts((prev) => [data, ...prev]);
      }
    };
    const addSnippet = async (id: string, userId: string) => {
      if (mode === "following" && !followedIds.includes(userId)) return;
      if (knownIdsRef.current.has(`snippet-${id}`)) return;
      const { data } = await getSnippetById(id);
      if (data && data.is_public) {
        knownIdsRef.current.add(`snippet-${id}`);
        setSnippets((prev) => [data, ...prev]);
      }
    };

    const chPosts = supabase
      .channel("feed-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload: RealtimeInsertPayload) => {
          const row = payload.new;
          addPost(row.id, row.user_id);
        }
      )
      .subscribe();

    const chSnippets = supabase
      .channel("feed-snippets")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "snippets" },
        (payload: RealtimeInsertPayload) => {
          const row = payload.new;
          addSnippet(row.id, row.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chPosts);
      supabase.removeChannel(chSnippets);
    };
  }, [mode, followedIds]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) =>
        item.type === "post" ? (
          <PostCard key={`post-${item.data.id}`} snippet={item.data} variant="flow" />
        ) : (
          <SnippetCard key={`snippet-${item.data.id}`} snippet={item.data} />
        )
      )}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

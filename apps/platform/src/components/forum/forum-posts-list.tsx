"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/components/forum/post-card";
import type { PostWithAuthor } from "@/lib/types/posts";

type ForumView = "grid" | "flow";

interface ForumPostsListProps {
  initialPosts: PostWithAuthor[];
  variant: ForumView;
  readMoreLabel: string;
}

/**
 * Client wrapper for the forum posts list.
 * Holds posts in local state and subscribes to Supabase Realtime DELETE events
 * so deleted posts disappear immediately for all connected users without a page reload.
 */
export function ForumPostsList({ initialPosts, variant, readMoreLabel }: ForumPostsListProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Sync when server re-renders with fresh data
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    const supabase = createClient();
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel("forum-delete-filter")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "DELETE", schema: "public", table: "posts" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const deletedId = (payload.old as { id: string }).id;
          setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={
        variant === "flow"
          ? "flex flex-col gap-2"
          : "grid gap-4 sm:grid-cols-2"
      }
    >
      {posts.map((post) => (
        <PostCard
          key={post.id}
          snippet={post}
          variant={variant}
          readMoreLabel={readMoreLabel}
        />
      ))}
    </div>
  );
}

"use client";

/**
 * useCardActions — real-time reactions + bookmarks for any post/snippet card.
 *
 * Implements the three-layer update architecture (Rule 8):
 *   1. Optimistic  — own actions update instantly, revert on error
 *   2. Realtime    — other users' reactions update via Supabase subscription
 *   3. Revalidation— server action calls revalidatePath for SSR consistency
 */

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleReaction } from "@/lib/actions/reactions";

export type CardTargetType = "post" | "snippet";

interface ActionsState {
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isInitialized: boolean;
}

interface UseCardActionsReturn {
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isInitialized: boolean;
  handleLike: (e: React.MouseEvent) => void;
  handleBookmark: (e: React.MouseEvent) => void;
}

export function useCardActions(
  targetId: string,
  targetType: CardTargetType,
  revalidatePath: string
): UseCardActionsReturn {
  const [state, setState] = useState<ActionsState>({
    likeCount: 0,
    isLiked: false,
    isBookmarked: false,
    isInitialized: false,
  });

  const currentUserIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // ── Layer 1: Initial data fetch ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const [{ count }, { data: { user } }] = await Promise.all([
        supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("target_type", targetType)
          .eq("target_id", targetId),
        supabase.auth.getUser(),
      ]);

      if (user) {
        currentUserIdRef.current = user.id;
        const [{ data: reaction }, { data: bookmark }] = await Promise.all([
          supabase
            .from("reactions")
            .select("user_id")
            .eq("user_id", user.id)
            .eq("target_type", targetType)
            .eq("target_id", targetId)
            .maybeSingle(),
          supabase
            .from("bookmarks")
            .select("user_id")
            .eq("user_id", user.id)
            .eq("target_type", targetType)
            .eq("target_id", targetId)
            .maybeSingle(),
        ]);
        setState({ likeCount: count ?? 0, isLiked: !!reaction, isBookmarked: !!bookmark, isInitialized: true });
      } else {
        setState({ likeCount: count ?? 0, isLiked: false, isBookmarked: false, isInitialized: true });
      }
    })();
  }, [targetId, targetType]);

  // ── Layer 2: Realtime — other users' reactions ─────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    channelRef.current = supabase
      .channel(`reactions:${targetType}:${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
          filter: `target_id=eq.${targetId}`,
        },
        (payload) => {
          // Skip own actions — already handled optimistically
          const changedUserId =
            (payload.new as Record<string, string> | null)?.user_id ??
            (payload.old as Record<string, string> | null)?.user_id;
          if (changedUserId && changedUserId === currentUserIdRef.current) return;

          setState((prev) => ({
            ...prev,
            likeCount:
              payload.eventType === "INSERT"
                ? prev.likeCount + 1
                : Math.max(0, prev.likeCount - 1),
          }));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [targetId, targetType]);

  // ── Handler: Like / Unlike (optimistic) ───────────────────────────────────
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !state.isLiked;
    // Optimistic update
    setState((prev) => ({
      ...prev,
      isLiked: next,
      likeCount: Math.max(0, next ? prev.likeCount + 1 : prev.likeCount - 1),
    }));

    // Server action — revert on error
    toggleReaction(targetType, targetId, "like", revalidatePath).catch(() => {
      setState((prev) => ({
        ...prev,
        isLiked: !next,
        likeCount: Math.max(0, !next ? prev.likeCount + 1 : prev.likeCount - 1),
      }));
    });
  };

  // ── Handler: Bookmark / Unbookmark (optimistic) ────────────────────────────
  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !state.isBookmarked;
    // Optimistic update
    setState((prev) => ({ ...prev, isBookmarked: next }));

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setState((prev) => ({ ...prev, isBookmarked: !next }));
        return;
      }
      if (next) {
        supabase
          .from("bookmarks")
          .insert({ user_id: user.id, target_type: targetType, target_id: targetId })
          .then(({ error }) => {
            if (error) setState((prev) => ({ ...prev, isBookmarked: !next }));
          });
      } else {
        supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId)
          .then(({ error }) => {
            if (error) setState((prev) => ({ ...prev, isBookmarked: !next }));
          });
      }
    });
  };

  return {
    likeCount: state.likeCount,
    isLiked: state.isLiked,
    isBookmarked: state.isBookmarked,
    isInitialized: state.isInitialized,
    handleLike,
    handleBookmark,
  };
}

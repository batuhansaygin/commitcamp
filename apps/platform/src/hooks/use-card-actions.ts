"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleReaction, getCardState } from "@/lib/actions/reactions";
import { toggleBookmark } from "@/lib/actions/bookmarks";
import { useUser } from "@/components/providers/user-provider";

export type CardTargetType = "post" | "snippet";

interface ActionsState {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isInitialized: boolean;
}

interface UseCardActionsReturn {
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isInitialized: boolean;
  handleLike: (e: React.MouseEvent) => void;
  handleBookmark: (e: React.MouseEvent) => void;
}

interface ReactionRealtimePayload {
  eventType: "INSERT" | "DELETE" | "UPDATE";
  new: { user_id?: string } | null;
  old: { user_id?: string } | null;
}

export function useCardActions(
  targetId: string,
  targetType: CardTargetType,
  _revalidatePathStr: string
): UseCardActionsReturn {
  const { user } = useUser();
  const viewerId = user?.id ?? null;

  const [state, setState] = useState<ActionsState>({
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    isBookmarked: false,
    isInitialized: false,
  });

  const currentUserIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const likePendingRef = useRef(false);
  const bookmarkPendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    currentUserIdRef.current = viewerId;
  }, [viewerId]);

  // Fetch initial state via server action (reliable cookie-based auth).
  // No viewerId dep -- the server action reads auth from cookies directly.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await getCardState(targetType, targetId);
        if (!cancelled) {
          setState({ ...result, isInitialized: true });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        // Fallback: browser client for count only
        try {
          const supabase = createClient();
          const { data: reactions } = await supabase
            .from("reactions")
            .select("user_id")
            .eq("target_type", targetType)
            .eq("target_id", targetId);

          const likeCount = reactions?.length ?? 0;
          const uid = currentUserIdRef.current;
          const isLiked = uid
            ? reactions?.some((r: { user_id: string }) => r.user_id === uid) ?? false
            : false;

          if (!cancelled) {
            setState({ likeCount, commentCount: 0, isLiked, isBookmarked: false, isInitialized: true });
          }
        } catch {
          if (!cancelled) {
            setState((prev) => ({ ...prev, isInitialized: true }));
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [targetId, targetType]);

  // Realtime — other users' reactions
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
        (payload: ReactionRealtimePayload) => {
          const changedUserId =
            payload.new?.user_id ?? payload.old?.user_id;
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

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (likePendingRef.current) return;
    likePendingRef.current = true;

    const next = !state.isLiked;
    setState((prev) => ({
      ...prev,
      isLiked: next,
      likeCount: Math.max(0, next ? prev.likeCount + 1 : prev.likeCount - 1),
    }));

    const revert = () => {
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isLiked: !next,
        likeCount: Math.max(0, !next ? prev.likeCount + 1 : prev.likeCount - 1),
      }));
    };

    (async () => {
      try {
        const basePath = targetType === "post" ? "/forum" : "/snippets";
        const result = await toggleReaction(targetType, targetId, "like", basePath);
        if (result.error) {
          revert();
        }
      } catch {
        revert();
      } finally {
        likePendingRef.current = false;
      }
    })();
  }, [state.isLiked, targetType, targetId]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (bookmarkPendingRef.current) return;
    bookmarkPendingRef.current = true;

    const next = !state.isBookmarked;
    setState((prev) => ({ ...prev, isBookmarked: next }));

    const revert = () => {
      if (mountedRef.current) setState((prev) => ({ ...prev, isBookmarked: !next }));
    };

    (async () => {
      try {
        const basePath = targetType === "post" ? "/forum" : "/snippets";
        const result = await toggleBookmark(targetType, targetId, basePath);
        if (result.error) revert();
      } catch {
        revert();
      } finally {
        bookmarkPendingRef.current = false;
      }
    })();
  }, [state.isBookmarked, targetType, targetId]);

  return {
    likeCount: state.likeCount,
    commentCount: state.commentCount,
    isLiked: state.isLiked,
    isBookmarked: state.isBookmarked,
    isInitialized: state.isInitialized,
    handleLike,
    handleBookmark,
  };
}

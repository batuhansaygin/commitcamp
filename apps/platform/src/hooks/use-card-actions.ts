"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleReaction } from "@/lib/actions/reactions";
import { toggleBookmark } from "@/lib/actions/bookmarks";

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
  const [state, setState] = useState<ActionsState>({
    likeCount: 0,
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

  const getCurrentUser = useCallback(async () => {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return user;
    } catch {
      // fall through
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.user ?? null;
    } catch {
      return null;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      try {
        const { count } = await supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("target_type", targetType)
          .eq("target_id", targetId);

        const user = await getCurrentUser();

        if (cancelled) return;

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
          if (cancelled) return;
          setState({
            likeCount: count ?? 0,
            isLiked: !!reaction,
            isBookmarked: !!bookmark,
            isInitialized: true,
          });
        } else {
          setState({
            likeCount: count ?? 0,
            isLiked: false,
            isBookmarked: false,
            isInitialized: true,
          });
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isInitialized: true }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [targetId, targetType, getCurrentUser]);

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
        const result = await toggleReaction(
          targetType,
          targetId,
          "like",
          basePath
        );
        if (result.error) revert();
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
    isLiked: state.isLiked,
    isBookmarked: state.isBookmarked,
    isInitialized: state.isInitialized,
    handleLike,
    handleBookmark,
  };
}

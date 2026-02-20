"use client";

/**
 * ForumLiveUpdater — subscribes to new forum posts via Supabase Realtime
 * and shows a non-disruptive "N new posts · Click to load" banner.
 *
 * Rule 8 — Pattern 3: "New items available" banner.
 * Does NOT auto-inject posts into the list; instead, lets the user decide when to load.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForumLiveUpdaterProps {
  /** Optional post type filter (discussion | question | showcase) */
  typeFilter?: string;
}

export function ForumLiveUpdater({ typeFilter }: ForumLiveUpdaterProps) {
  const [newCount, setNewCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const resetDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setDismissed(true), 30_000);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    channelRef.current = supabase
      .channel("forum-new-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          // If a type filter is active, only count matching new posts
          ...(typeFilter ? { filter: `type=eq.${typeFilter}` } : {}),
        },
        () => {
          setNewCount((c) => c + 1);
          setDismissed(false);
          resetDismissTimer();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [typeFilter, resetDismissTimer]);

  const handleLoad = () => {
    setNewCount(0);
    setDismissed(false);
    router.refresh();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setNewCount(0);
  };

  if (newCount === 0 || dismissed) return null;

  return (
    <div className="flex justify-center">
      <button
        onClick={handleLoad}
        className={cn(
          "group flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10",
          "px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur-sm",
          "transition-all duration-200 hover:bg-primary/20 hover:border-primary/50 hover:shadow-md",
          "animate-in slide-in-from-top-2 fade-in duration-300"
        )}
      >
        <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
        <span>
          {newCount === 1 ? "1 new post" : `${newCount} new posts`} · Click to load
        </span>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="ml-1 rounded-full p-0.5 opacity-60 hover:opacity-100 hover:bg-primary/20 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </button>
    </div>
  );
}

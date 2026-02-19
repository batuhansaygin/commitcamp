"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Check } from "lucide-react";
import { toggleReaction } from "@/lib/actions/reactions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SnippetCardActionsProps {
  snippetId: string;
}

export function SnippetCardActions({ snippetId }: SnippetCardActionsProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const [{ count }, { data: { user } }] = await Promise.all([
        supabase
          .from("reactions")
          .select("*", { count: "exact", head: true })
          .eq("target_type", "snippet")
          .eq("target_id", snippetId),
        supabase.auth.getUser(),
      ]);

      setLikeCount(count ?? 0);

      if (user) {
        const [{ data: reaction }, { data: bookmark }] = await Promise.all([
          supabase
            .from("reactions")
            .select("user_id")
            .eq("user_id", user.id)
            .eq("target_type", "snippet")
            .eq("target_id", snippetId)
            .maybeSingle(),
          supabase
            .from("bookmarks")
            .select("user_id")
            .eq("user_id", user.id)
            .eq("target_type", "snippet")
            .eq("target_id", snippetId)
            .maybeSingle(),
        ]);
        setIsLiked(!!reaction);
        setIsBookmarked(!!bookmark);
      }
    })();
  }, [snippetId]);

  const stopAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLike = async (e: React.MouseEvent) => {
    stopAll(e);
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => Math.max(0, next ? c + 1 : c - 1));
    await toggleReaction("snippet", snippetId, "like", "/snippets");
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    stopAll(e);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const next = !isBookmarked;
    setIsBookmarked(next);

    if (next) {
      await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, target_type: "snippet", target_id: snippetId });
    } else {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "snippet")
        .eq("target_id", snippetId);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    stopAll(e);
    try {
      const locale = window.location.pathname.split("/")[1];
      const url = `${window.location.origin}/${locale}/snippets/${snippetId}`;
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <div
      className="flex items-center gap-0.5 pt-2.5 border-t border-border/40"
      onClick={stopAll}
    >
      {/* Like */}
      <button
        onClick={handleLike}
        aria-label="Like"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all hover:bg-muted active:scale-95",
          isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Heart
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            isLiked && "fill-current scale-110"
          )}
        />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      {/* Comment — navigates to snippet detail */}
      <a
        href={`/snippets/${snippetId}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Comments"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </a>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        aria-label="Bookmark"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all hover:bg-muted active:scale-95",
          isBookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Bookmark
          className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")}
        />
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        aria-label="Copy link"
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
      >
        {shared ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

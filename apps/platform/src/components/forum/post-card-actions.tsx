"use client";

import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Check } from "lucide-react";
import { useCardActions } from "@/hooks/use-card-actions";
import { cn } from "@/lib/utils";

interface PostCardActionsProps {
  postId: string;
}

export function PostCardActions({ postId }: PostCardActionsProps) {
  const { likeCount, isLiked, isBookmarked, handleLike, handleBookmark } =
    useCardActions(postId, "post", "/forum");

  const [shared, setShared] = useState(false);

  const stopAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleShare = async (e: React.MouseEvent) => {
    stopAll(e);
    try {
      const locale = window.location.pathname.split("/")[1];
      const url = `${window.location.origin}/${locale}/forum/${postId}`;
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // clipboard not available — silently fail
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

      {/* Comment — navigates to post detail */}
      <a
        href={`/forum/${postId}`}
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
        <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
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

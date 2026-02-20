"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { addComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { User, Loader2, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CommentWithAuthor } from "@/lib/types/posts";

interface CommentSectionProps {
  targetType: "post" | "snippet";
  targetId: string;
  comments: CommentWithAuthor[];
  isAuthenticated: boolean;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CommentSection({
  targetType,
  targetId,
  comments: initialComments,
  isAuthenticated,
}: CommentSectionProps) {
  const t = useTranslations("forum");
  const [state, action, pending] = useActionState(addComment, {});
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local state starts with SSR-rendered comments, then receives real-time updates
  const [liveComments, setLiveComments] =
    useState<CommentWithAuthor[]>(initialComments);

  // Reset the form and focus textarea after a successful comment submission
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state.success]);

  // Supabase Realtime — live comment updates without page refresh
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`comments:${targetType}:${targetId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `target_id=eq.${targetId}`,
        },
        async (payload) => {
          const newComment = payload.new as { id: string; user_id: string; content: string; created_at: string; target_type: string; target_id: string; parent_id: string | null };

          // Avoid duplicating comments we already have in state
          setLiveComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;

            // Fetch author profile in the background, then update state with it
            supabase
              .from("profiles")
              .select("username, display_name, avatar_url, level")
              .eq("id", newComment.user_id)
              .single()
              .then(({ data: authorProfile }) => {
                setLiveComments((p) =>
                  p.map((c) =>
                    c.id === newComment.id
                      ? {
                          ...c,
                          profiles: authorProfile as CommentWithAuthor["profiles"],
                        }
                      : c
                  )
                );
              });

            return [
              ...prev,
              { ...newComment, profiles: null } as CommentWithAuthor,
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `target_id=eq.${targetId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setLiveComments((prev) => prev.filter((c) => c.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId]);

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        {t("comments")} ({liveComments.length})
      </h3>

      {/* Comments list */}
      {liveComments.length > 0 ? (
        <div className="space-y-3">
          {liveComments.map((comment) => {
            const name =
              comment.profiles?.display_name ||
              comment.profiles?.username ||
              "Anonymous";
            return (
              <div
                key={comment.id}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {comment.profiles?.username ? (
                      <Link
                        href={`/profile/${comment.profiles.username}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{name}</span>
                    )}
                  </div>
                  <span>{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noComments")}</p>
      )}

      {/* Add comment form */}
      {isAuthenticated ? (
        <form ref={formRef} action={action} className="space-y-2">
          <input type="hidden" name="target_type" value={targetType} />
          <input type="hidden" name="target_id" value={targetId} />

          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              Comment posted!
            </div>
          )}

          <textarea
            ref={textareaRef}
            name="content"
            required
            minLength={1}
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={t("commentPlaceholder")}
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : null}
            {t("addComment")}
          </Button>
        </form>
      ) : (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}
    </div>
  );
}

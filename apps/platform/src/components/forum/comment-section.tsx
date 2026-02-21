"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { addCommentDirect, deleteComment, updateComment } from "@/lib/actions/comments";
import { toggleReaction } from "@/lib/actions/reactions";
import { Button } from "@/components/ui/button";
import { ReactionUsersDialog } from "@/components/reactions/reaction-users-dialog";
import { ReportDialog } from "@/components/reports/report-dialog";
import {
  User,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Check,
  Reply,
  Heart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CommentWithAuthor } from "@/lib/types/posts";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("forum");
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {t("addComment")}
    </Button>
  );
}

interface CurrentUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface CommentSectionProps {
  targetType: "post" | "snippet";
  targetId: string;
  comments: CommentWithAuthor[];
  isAuthenticated: boolean;
  currentUser?: CurrentUser | null;
}

interface CommentInsertPayload {
  new: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    target_type: string;
    target_id: string;
    parent_id: string | null;
  };
}

interface CommentUpdatePayload {
  new: {
    id: string;
    content: string;
    updated_at: string;
  };
}

interface CommentDeletePayload {
  old: {
    id: string;
    parent_id: string | null;
  };
}

type CommentAuthorProfile = CommentWithAuthor["profiles"];

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

const OPTIMISTIC_PREFIX = "__optimistic__";

function isEdited(comment: CommentWithAuthor): boolean {
  return new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime();
}

export function CommentSection({
  targetType,
  targetId,
  comments: initialComments,
  isAuthenticated,
  currentUser,
}: CommentSectionProps) {
  const t = useTranslations("forum");
  const formRef = useRef<HTMLFormElement>(null);
  const prevCommentsLengthRef = useRef(initialComments.length);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [liveComments, setLiveComments] =
    useState<CommentWithAuthor[]>(initialComments);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [rowPendingId, setRowPendingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyPendingId, setReplyPendingId] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [reactionLikedByMe, setReactionLikedByMe] = useState<Record<string, boolean>>(
    {}
  );

  const showSuccessToast = (message: string) => {
    setSuccessToast(message);
    window.setTimeout(() => setSuccessToast(null), 2200);
  };

  const scrollToComment = (commentId: string) => {
    window.setTimeout(() => {
      commentRefs.current[commentId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  };

  // Sync with server data when parent re-renders
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveComments((prev) => {
      const serverIds = new Set(initialComments.map((c) => c.id));
      const stillOptimistic = prev.filter(
        (c) => c.id.startsWith(OPTIMISTIC_PREFIX) && !serverIds.has(c.id)
      );
      return [...initialComments, ...stillOptimistic];
    });
  }, [initialComments]);

  // Reset form when a new comment appears (after server action + revalidate)
  useEffect(() => {
    if (initialComments.length > prevCommentsLengthRef.current) {
      prevCommentsLengthRef.current = initialComments.length;
      formRef.current?.reset();
    } else {
      prevCommentsLengthRef.current = initialComments.length;
    }
  }, [initialComments.length]);

  useEffect(() => {
    const commentIds = liveComments
      .filter((c) => !c.id.startsWith(OPTIMISTIC_PREFIX))
      .map((c) => c.id);

    if (commentIds.length === 0) {
      setReactionCounts({});
      setReactionLikedByMe({});
      return;
    }

    const supabase = createClient();
    const loadReactions = async () => {
      const { data: reactions } = await supabase
        .from("reactions")
        .select("target_id,user_id")
        .eq("target_type", "comment")
        .in("target_id", commentIds);

      const counts: Record<string, number> = {};
      for (const id of commentIds) counts[id] = 0;
      for (const reaction of reactions ?? []) {
        counts[reaction.target_id] = (counts[reaction.target_id] ?? 0) + 1;
      }
      setReactionCounts(counts);

      if (!currentUser) {
        setReactionLikedByMe({});
        return;
      }

      const { data: ownReactions } = await supabase
        .from("reactions")
        .select("target_id")
        .eq("target_type", "comment")
        .eq("user_id", currentUser.id)
        .in("target_id", commentIds);

      const liked: Record<string, boolean> = {};
      for (const reaction of ownReactions ?? []) liked[reaction.target_id] = true;
      setReactionLikedByMe(liked);
    };

    void loadReactions();
  }, [liveComments, currentUser]);

  // Supabase Realtime — live comment updates without page refresh
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

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
        (payload: CommentInsertPayload) => {
          if (!isMounted) return;
          const newComment = payload.new;

          setLiveComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;

            // Our own comment arriving — replace the optimistic placeholder
            const ownOptimisticIdx = currentUser
              ? prev.findIndex(
                  (c) =>
                    c.id.startsWith(OPTIMISTIC_PREFIX) &&
                    c.user_id === currentUser.id &&
                    c.parent_id === newComment.parent_id &&
                    c.content === newComment.content
                )
              : -1;

            if (ownOptimisticIdx !== -1) {
              const updated = [...prev];
              updated[ownOptimisticIdx] = {
                ...newComment,
                profiles: prev[ownOptimisticIdx].profiles,
              } as CommentWithAuthor;
              scrollToComment(newComment.id);
              return updated;
            }

            // Someone else's comment — fetch their profile in background
            supabase
              .from("profiles")
              .select("username, display_name, avatar_url, level")
              .eq("id", newComment.user_id)
              .single()
              .then(({ data: authorProfile }: { data: CommentAuthorProfile }) => {
                if (!isMounted) return;
                setLiveComments((p) =>
                  p.map((c) =>
                    c.id === newComment.id
                      ? { ...c, profiles: authorProfile }
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
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `target_id=eq.${targetId}`,
        },
        (payload: CommentUpdatePayload) => {
          if (!isMounted) return;
          const updatedComment = payload.new;
          setLiveComments((prev) =>
            prev.map((comment) =>
              comment.id === updatedComment.id
                ? {
                    ...comment,
                    content: updatedComment.content,
                    updated_at: updatedComment.updated_at,
                  }
                : comment
            )
          );
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
        (payload: CommentDeletePayload) => {
          if (!isMounted) return;
          const deleted = payload.old;
          setLiveComments((prev) =>
            prev.filter((c) => c.id !== deleted.id && c.parent_id !== deleted.id)
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId, currentUser]);

  const createOptimisticComment = (content: string, parentId: string | null) => {
    if (!currentUser) return null;
    const now = new Date().toISOString();
    return {
      id: `${OPTIMISTIC_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}`,
      user_id: currentUser.id,
      target_type: targetType,
      target_id: targetId,
      parent_id: parentId,
      content,
      created_at: now,
      updated_at: now,
      profiles: {
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
        level: currentUser.level,
      },
    } as CommentWithAuthor;
  };

  const submitComment = async (content: string, parentId: string | null) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setSubmitError("Comment cannot be empty.");
      return;
    }

    setSubmitError(null);
    const optimisticComment = createOptimisticComment(trimmed, parentId);
    if (optimisticComment) {
      setLiveComments((prev) => [...prev, optimisticComment]);
      scrollToComment(optimisticComment.id);
    }

    const formData = new FormData();
    formData.set("target_type", targetType);
    formData.set("target_id", targetId);
    formData.set("content", trimmed);
    if (parentId) formData.set("parent_id", parentId);

    const result = await addCommentDirect(formData);
    if (result.error) {
      setSubmitError(result.error);
      if (optimisticComment) {
        setLiveComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      }
      return;
    }

    showSuccessToast("Comment saved.");
  };

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated) return;
    const wasLiked = !!reactionLikedByMe[commentId];
    setReactionLikedByMe((prev) => ({ ...prev, [commentId]: !wasLiked }));
    setReactionCounts((prev) => ({
      ...prev,
      [commentId]: Math.max(0, (prev[commentId] ?? 0) + (wasLiked ? -1 : 1)),
    }));

    const result = await toggleReaction(
      "comment",
      commentId,
      "like",
      targetType === "post" ? "/forum" : "/snippets"
    );

    if (result.error) {
      setReactionLikedByMe((prev) => ({ ...prev, [commentId]: wasLiked }));
      setReactionCounts((prev) => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] ?? 0) + (wasLiked ? 1 : -1)),
      }));
    }
  };

  const rootComments = liveComments.filter((c) => c.parent_id === null);
  const repliesMap = liveComments.reduce<Record<string, CommentWithAuthor[]>>((acc, c) => {
    if (!c.parent_id) return acc;
    acc[c.parent_id] = [...(acc[c.parent_id] ?? []), c];
    return acc;
  }, {});

  const renderComment = (comment: CommentWithAuthor, depth = 0) => {
    const name =
      comment.profiles?.display_name ||
      comment.profiles?.username ||
      "Anonymous";
    const isOptimistic = comment.id.startsWith(OPTIMISTIC_PREFIX);
    const isOwnComment = !!currentUser && comment.user_id === currentUser.id;
    const likes = reactionCounts[comment.id] ?? 0;
    const isLiked = !!reactionLikedByMe[comment.id];
    const children = repliesMap[comment.id] ?? [];

    return (
      <div key={comment.id} className={depth > 0 ? "ml-6 border-l border-border/60 pl-3" : ""}>
        <div
          ref={(el) => {
            commentRefs.current[comment.id] = el;
          }}
          className={`rounded-lg border border-border bg-muted/30 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200 ${
            isOptimistic ? "opacity-60" : ""
          }`}
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
              {isOptimistic && (
                <span className="text-[10px] text-muted-foreground/60 italic">posting…</span>
              )}
              {!isOptimistic && isEdited(comment) ? (
                <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                  {t("edited")}
                </span>
              ) : null}
            </div>
            <span>{timeAgo(comment.created_at)}</span>
          </div>

          {editingId === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editingContent}
                onChange={(event) => setEditingContent(event.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-lg border border-border bg-input p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={rowPendingId === comment.id}
                  onClick={async () => {
                    const next = editingContent.trim();
                    if (!next) return;
                    const prevComments = liveComments;
                    setRowPendingId(comment.id);
                    setLiveComments((prev) =>
                      prev.map((c) =>
                        c.id === comment.id
                          ? { ...c, content: next, updated_at: new Date().toISOString() }
                          : c
                      )
                    );
                    const result = await updateComment(comment.id, next);
                    if (result.error) {
                      setLiveComments(prevComments);
                      setSubmitError(result.error);
                    } else {
                      setEditingId(null);
                      setEditingContent("");
                      showSuccessToast("Comment updated.");
                    }
                    setRowPendingId(null);
                  }}
                >
                  {rowPendingId === comment.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  {t("saveComment")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={rowPendingId === comment.id}
                  onClick={() => {
                    setEditingId(null);
                    setEditingContent("");
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  {t("cancelEdit")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {!isOptimistic ? (
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-[11px] ${isLiked ? "text-red-500" : ""}`}
                onClick={() => void handleLike(comment.id)}
              >
                <Heart className={`mr-1 h-3 w-3 ${isLiked ? "fill-current" : ""}`} />
                {likes}
              </Button>
              <ReactionUsersDialog targetType="comment" targetId={comment.id} count={likes} />

              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    setReplyingToId(comment.id);
                    setReplyContent("");
                  }}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  {t("reply")}
                </Button>
              ) : null}

              {isOwnComment ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    disabled={rowPendingId === comment.id}
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditingContent(comment.content);
                    }}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    {t("editComment")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                    disabled={rowPendingId === comment.id}
                    onClick={async () => {
                      const prevComments = liveComments;
                      setRowPendingId(comment.id);
                      setLiveComments((prev) =>
                        prev.filter((c) => c.id !== comment.id && c.parent_id !== comment.id)
                      );
                      const result = await deleteComment(comment.id);
                      if (result.error) {
                        setLiveComments(prevComments);
                        setSubmitError(result.error);
                      } else {
                        showSuccessToast("Comment deleted.");
                      }
                      setRowPendingId(null);
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    {t("deleteComment")}
                  </Button>
                </>
              ) : isAuthenticated ? (
                <ReportDialog
                  targetType="comment"
                  targetId={comment.id}
                  triggerLabel="Report"
                  compact
                />
              ) : null}
            </div>
          ) : null}

          {replyingToId === comment.id ? (
            <div className="space-y-2 rounded-md border border-border/70 bg-background/60 p-2">
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full rounded-md border border-border bg-input p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t("replyPlaceholder")}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={replyPendingId === comment.id}
                  onClick={async () => {
                    setReplyPendingId(comment.id);
                    await submitComment(replyContent, comment.id);
                    setReplyPendingId(null);
                    setReplyingToId(null);
                    setReplyContent("");
                  }}
                >
                  {replyPendingId === comment.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {t("postReply")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyContent("");
                  }}
                >
                  {t("cancelEdit")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {children.length > 0 ? (
          <div className="mt-2 space-y-2">
            {children.map((child) => renderComment(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        {t("comments")} ({rootComments.length})
      </h3>

      {/* Comments list */}
      {rootComments.length > 0 ? (
        <div className="space-y-3">{rootComments.map((comment) => renderComment(comment))}</div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noComments")}</p>
      )}

      {/* Add comment form */}
      {isAuthenticated ? (
        <form
          ref={formRef}
          action={async (formData) => {
            const raw = formData.get("content");
            const content = typeof raw === "string" ? raw : "";
            await submitComment(content, null);
            formRef.current?.reset();
          }}
          className="space-y-2"
        >
          <input type="hidden" name="target_type" value={targetType} />
          <input type="hidden" name="target_id" value={targetId} />
          <textarea
            name="content"
            required
            minLength={1}
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={t("commentPlaceholder")}
          />
          <SubmitButton />
          {submitError ? (
            <p className="text-xs text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {successToast ? (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 shadow-lg"
        >
          {successToast}
        </div>
      ) : null}
    </div>
  );
}

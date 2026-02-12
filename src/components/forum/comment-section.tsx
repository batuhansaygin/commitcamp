"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { User, Loader2, AlertCircle } from "lucide-react";
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
  comments,
  isAuthenticated,
}: CommentSectionProps) {
  const t = useTranslations("forum");
  const [state, action, pending] = useActionState(addComment, {});

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">
        {t("comments")} ({comments.length})
      </h3>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => {
            const name =
              comment.profiles?.display_name ||
              comment.profiles?.username ||
              "Anonymous";
            return (
              <div
                key={comment.id}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span className="font-medium text-foreground">{name}</span>
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
        <form action={action} className="space-y-2">
          <input type="hidden" name="target_type" value={targetType} />
          <input type="hidden" name="target_id" value={targetId} />

          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {state.error}
            </div>
          )}

          <textarea
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
        <p className="text-xs text-muted-foreground">{t("loginToComment")}</p>
      )}
    </div>
  );
}

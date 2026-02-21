"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { deletePost, toggleSolved } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, CheckCircle2, Pencil } from "lucide-react";
import { ReportDialog } from "@/components/reports/report-dialog";

interface PostActionsProps {
  postId: string;
  isQuestion: boolean;
  isSolved: boolean;
  isAuthor: boolean;
  isAuthenticated: boolean;
  onSolvedChange?: (solved: boolean) => void;
}

export function PostActions({
  postId,
  isQuestion,
  isSolved,
  isAuthor,
  isAuthenticated,
  onSolvedChange,
}: PostActionsProps) {
  const t = useTranslations("forum");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [solved, setSolved] = useState(isSolved);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    await deletePost(postId);
  };

  const handleToggleSolved = async () => {
    const next = !solved;
    // Optimistic update — instant feedback
    setSolved(next);
    onSolvedChange?.(next);
    setToggling(true);
    const result = await toggleSolved(postId, next);
    if (result.error) {
      // Revert on error
      setSolved(!next);
      onSolvedChange?.(!next);
    }
    setToggling(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      {/* Edit */}
      {isAuthor ? (
        <Link href={`/forum/${postId}/edit`}>
          <Button variant="outline" size="sm" className="text-xs">
            <Pencil className="mr-1 h-3 w-3" />
            {t("editPost")}
          </Button>
        </Link>
      ) : null}

      {/* Toggle solved for questions */}
      {isQuestion && isAuthor && (
        <Button
          variant={solved ? "outline" : "default"}
          size="sm"
          onClick={handleToggleSolved}
          disabled={toggling}
          className="text-xs"
        >
          {toggling ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1 h-3 w-3" />
          )}
          {solved ? t("markUnsolved") : t("markSolved")}
        </Button>
      )}

      {isAuthenticated ? <ReportDialog targetType="post" targetId={postId} /> : null}

      {/* Delete */}
      <div className="ml-auto flex items-center gap-2">
        {!isAuthor ? null : (
          <>
        {confirming && !deleting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs"
        >
          {deleting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="mr-1 h-3 w-3" />
          )}
          {confirming ? t("deleteConfirm") : t("deletePost")}
        </Button>
          </>
        )}
      </div>
    </div>
  );
}

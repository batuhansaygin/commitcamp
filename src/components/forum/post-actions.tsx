"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deletePost, toggleSolved } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface PostActionsProps {
  postId: string;
  isQuestion: boolean;
  isSolved: boolean;
}

export function PostActions({ postId, isQuestion, isSolved }: PostActionsProps) {
  const t = useTranslations("forum");
  const router = useRouter();
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
    setToggling(true);
    const result = await toggleSolved(postId, !solved);
    if (!result.error) {
      setSolved(!solved);
      router.refresh();
    }
    setToggling(false);
  };

  return (
    <div className="flex items-center gap-2 border-t border-border pt-4">
      {/* Toggle solved for questions */}
      {isQuestion && (
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

      {/* Delete */}
      <div className="ml-auto flex items-center gap-2">
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
      </div>
    </div>
  );
}

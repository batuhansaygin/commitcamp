"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { PostActions } from "@/components/forum/post-actions";
import { useTranslations } from "@/lib/i18n";

interface PostSolvedWrapperProps {
  postId: string;
  isQuestion: boolean;
  initialIsSolved: boolean;
  isAuthor: boolean;
  isAuthenticated: boolean;
}

/**
 * Client wrapper that keeps the "Solved" badge and PostActions in sync
 * without a full page refresh. The solved state is managed here so both
 * the badge and the toggle button reflect the same value instantly.
 */
export function PostSolvedWrapper({
  postId,
  isQuestion,
  initialIsSolved,
  isAuthor,
  isAuthenticated,
}: PostSolvedWrapperProps) {
  const t = useTranslations("forum");
  const [isSolved, setIsSolved] = useState(initialIsSolved);

  return (
    <>
      {isQuestion && isSolved && (
        <Badge variant="success" className="text-[10px]">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {t("solved")}
        </Badge>
      )}

      <PostActions
        postId={postId}
        isQuestion={isQuestion}
        isSolved={isSolved}
        isAuthor={isAuthor}
        isAuthenticated={isAuthenticated}
        onSolvedChange={setIsSolved}
      />
    </>
  );
}

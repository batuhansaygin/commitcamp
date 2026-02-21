"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { deleteSnippet, updateSnippetVisibility } from "@/lib/actions/snippets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, Loader2, Globe, Lock } from "lucide-react";
import { ReportDialog } from "@/components/reports/report-dialog";

interface SnippetActionsProps {
  snippetId: string;
  isPublic: boolean;
  isAuthor: boolean;
  isAuthenticated: boolean;
  onVisibilityChange?: (isPublic: boolean) => void;
}

export function SnippetActions({
  snippetId,
  isPublic: initialIsPublic,
  isAuthor,
  isAuthenticated,
  onVisibilityChange,
}: SnippetActionsProps) {
  const t = useTranslations("snippets");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const handleSetPublic = async (publicValue: boolean) => {
    if (isPublic === publicValue) return;
    // Optimistic update — instant feedback, no router.refresh()
    setIsPublic(publicValue);
    onVisibilityChange?.(publicValue);
    setTogglingVisibility(true);
    const result = await updateSnippetVisibility(snippetId, publicValue);
    if (result.error) {
      // Revert on error
      setIsPublic(!publicValue);
      onVisibilityChange?.(!publicValue);
    }
    setTogglingVisibility(false);
  };

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    await deleteSnippet(snippetId);
  };

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {/* Visibility: same pill style as forum grid/flow */}
      {isAuthor ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {t("visibility")}
          </span>
          <div
            className="flex rounded-lg border border-border bg-muted/30 p-0.5"
            role="group"
            aria-label={t("visibility")}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
                isPublic
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleSetPublic(true)}
              disabled={togglingVisibility}
              aria-pressed={isPublic}
            >
              <Globe className="h-3.5 w-3.5" />
              {t("everyone")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
                !isPublic
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleSetPublic(false)}
              disabled={togglingVisibility}
              aria-pressed={!isPublic}
            >
              <Lock className="h-3.5 w-3.5" />
              {t("onlyMe")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Delete */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? <ReportDialog targetType="snippet" targetId={snippetId} /> : null}
        {isAuthor ? (
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
              {confirming ? t("deleteConfirm") : t("deleteSnippet")}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

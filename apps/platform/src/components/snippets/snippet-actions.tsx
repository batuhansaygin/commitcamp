"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "@/i18n/navigation";
import { deleteSnippet, updateSnippetVisibility } from "@/lib/actions/snippets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2, Loader2, Globe, Lock } from "lucide-react";

interface SnippetActionsProps {
  snippetId: string;  isPublic: boolean;
}

export function SnippetActions({
  snippetId,
  isPublic: initialIsPublic,
}: SnippetActionsProps) {
  const t = useTranslations("snippets");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const handleSetPublic = async (publicValue: boolean) => {
    if (isPublic === publicValue) return;
    setTogglingVisibility(true);
    const result = await updateSnippetVisibility(snippetId, publicValue);
    if (!result.error) {
      setIsPublic(publicValue);
      router.refresh();
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

      {/* Delete */}
      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}

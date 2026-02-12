"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteSnippet } from "@/lib/actions/snippets";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface SnippetActionsProps {
  snippetId: string;
}

export function SnippetActions({ snippetId }: SnippetActionsProps) {
  const t = useTranslations("snippets");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    await deleteSnippet(snippetId);
  };

  return (
    <div className="flex items-center gap-2 border-t border-border pt-4">
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
  );
}

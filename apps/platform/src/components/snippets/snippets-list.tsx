"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { SnippetCard } from "@/components/snippets/snippet-card";
import type { SnippetWithAuthor } from "@/lib/types/snippets";

interface SnippetsListProps {
  initialSnippets: SnippetWithAuthor[];
}

/**
 * Client wrapper for the snippets grid.
 * Holds snippets in local state and subscribes to Supabase Realtime DELETE events
 * so deleted snippets disappear immediately for all connected users without a page reload.
 */
export function SnippetsList({ initialSnippets }: SnippetsListProps) {
  const [snippets, setSnippets] = useState<SnippetWithAuthor[]>(initialSnippets);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Sync when server re-renders with fresh data
  useEffect(() => {
    setSnippets(initialSnippets);
  }, [initialSnippets]);

  useEffect(() => {
    const supabase = createClient();
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel("snippets-delete-filter")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "DELETE", schema: "public", table: "snippets" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const deletedId = (payload.old as { id: string }).id;
          setSnippets((prev) => prev.filter((s) => s.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
}

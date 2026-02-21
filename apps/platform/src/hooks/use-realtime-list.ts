"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeListOptions {
  /** Supabase table to subscribe to */
  table: string;
  /** Optional postgres filter, e.g. "user_id=eq.abc123" */
  filter?: string;
  /** Which events to listen to (default: all) */
  events?: RealtimeEvent[];
  /** Unique channel name suffix to avoid collisions */
  channelKey: string;
}

interface UseRealtimeListResult<T extends { id: string }> {
  items: T[];
  /** Prepend or append a new item (optimistic insert) */
  addItem: (item: T, position?: "start" | "end") => void;
  /** Merge a patch into an existing item by id */
  updateItem: (id: string, patch: Partial<T>) => void;
  /** Remove an item by id */
  removeItem: (id: string) => void;
  /** Replace the entire list */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Generic hook that holds a list in local state and subscribes to Supabase
 * Realtime postgres_changes events so any admin/other-user mutations are
 * reflected immediately without a page reload.
 *
 * The caller is responsible for handling optimistic updates for their own
 * actions (call addItem/updateItem/removeItem directly after the server action).
 * This hook handles *other* users' changes via Realtime.
 */
export function useRealtimeList<T extends { id: string }>(
  initialItems: T[],
  options: UseRealtimeListOptions,
  onExternalInsert?: (row: T) => void,
  onExternalUpdate?: (row: T) => void,
  onExternalDelete?: (id: string) => void
): UseRealtimeListResult<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const addItem = useCallback((item: T, position: "start" | "end" = "start") => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return position === "start" ? [item, ...prev] : [...prev, item];
    });
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<T>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const events = options.events ?? ["INSERT", "UPDATE", "DELETE"];
    let channel = supabase.channel(`realtime-list:${options.channelKey}`);

    for (const event of events) {
      channel = channel.on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event,
          schema: "public",
          table: options.table,
          ...(options.filter ? { filter: options.filter } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (event === "INSERT" || (event === "*" && payload.eventType === "INSERT")) {
            const row = payload.new as T;
            if (onExternalInsert) {
              onExternalInsert(row);
            } else {
              addItem(row, "start");
            }
          } else if (event === "UPDATE" || (event === "*" && payload.eventType === "UPDATE")) {
            const row = payload.new as T;
            if (onExternalUpdate) {
              onExternalUpdate(row);
            } else {
              updateItem(row.id, row);
            }
          } else if (event === "DELETE" || (event === "*" && payload.eventType === "DELETE")) {
            const id = (payload.old as { id: string }).id;
            if (onExternalDelete) {
              onExternalDelete(id);
            } else {
              removeItem(id);
            }
          }
        }
      );
    }

    channelRef.current = channel.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [options.channelKey, options.table, options.filter]);

  return { items, addItem, updateItem, removeItem, setItems };
}

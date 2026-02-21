"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { saveToolHistory } from "@/lib/actions/tool-history";
import { createClient } from "@/lib/supabase/client";
import { getSaveHistoryPreference } from "./tools-save-switch";

export function ToolHistoryTracker() {
  const pathname = usePathname();
  const savedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const match = pathname?.match(/\/tools\/([a-z0-9-]+)$/);
    const slug = match?.[1];
    if (!slug || slug === "tools") return;

    let cancelled = false;

    const run = async () => {
      const savePref = getSaveHistoryPreference();
      if (!savePref) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const key = `${user.id}:${slug}`;
      if (savedRef.current.has(key)) return;
      savedRef.current.add(key);

      await saveToolHistory(slug);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ToolHistoryEntry = {
  id: string;
  tool_slug: string;
  summary: string | null;
  created_at: string;
};

export async function saveToolHistory(
  toolSlug: string,
  summary?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("tool_history").insert({
    user_id: user.id,
    tool_slug: toolSlug,
    summary: summary ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/tools", "layout");
  return {};
}

export async function getToolHistory(
  limit = 20
): Promise<{ data: ToolHistoryEntry[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from("tool_history")
    .select("id, tool_slug, summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return {
    data: (data ?? []).map((r) => ({
      id: r.id,
      tool_slug: r.tool_slug,
      summary: r.summary,
      created_at: r.created_at,
    })),
  };
}

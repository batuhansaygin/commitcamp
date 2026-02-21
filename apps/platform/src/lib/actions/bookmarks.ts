"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookmarkTargetType = "post" | "snippet";

interface ToggleBookmarkResult {
  error?: string;
  added?: boolean;
}

export async function toggleBookmark(
  targetType: BookmarkTargetType,
  targetId: string,
  revalidatePathStr: string
): Promise<ToggleBookmarkResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to bookmark." };

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      if (error) return { error: error.message };
      revalidatePath(revalidatePathStr, "layout");
      return { added: false };
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    });
    if (error) return { error: error.message };
    revalidatePath(revalidatePathStr, "layout");
    return { added: true };
  } catch {
    return { error: "An error occurred." };
  }
}

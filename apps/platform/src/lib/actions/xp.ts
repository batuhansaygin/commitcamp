"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateLevel } from "@/lib/xp";
import { createNotification } from "@/lib/actions/notifications";
import type { XPReason } from "@/lib/types/xp";

/**
 * Award XP to a user by calling the increment_xp database function.
 * Also detects level-up events and creates a level_up notification.
 * Silently ignores errors so XP failures never break the main action.
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: XPReason
): Promise<void> {
  try {
    const supabase = await createClient();

    // Read current XP before awarding so we can detect level changes
    const { data: before } = await supabase
      .from("profiles")
      .select("xp_points")
      .eq("id", userId)
      .single();

    const prevLevel = calculateLevel(before?.xp_points ?? 0);

    await supabase.rpc("increment_xp", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
    });

    const newLevel = calculateLevel((before?.xp_points ?? 0) + amount);
    if (newLevel > prevLevel) {
      await createNotification({
        user_id: userId,
        actor_id: null,
        type: "level_up",
        message: `You reached Level ${newLevel}!`,
      });
    }
  } catch {
    // XP award failures are non-critical — do not propagate
  }
}

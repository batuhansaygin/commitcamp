"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "./audit";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function listAchievementsAdmin() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("achievements")
    .select(`
      id, name, description, icon, xp_reward, rarity, category, is_active, criteria,
      earned_count:user_achievements(count)
    `)
    .order("category")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAchievement(input: {
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: string;
  category: string;
  criteria: Record<string, unknown>;
}): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("achievements").insert({
    ...input,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  await logAdminAction("create_achievement", "achievement", null, { name: input.name });
  revalidatePath("/admin/achievements");
}

export async function updateAchievement(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    rarity: string;
    category: string;
    is_active: boolean;
    criteria: Record<string, unknown>;
  }>
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("achievements")
    .update(updates)
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logAdminAction("update_achievement", "achievement", id, updates);
  revalidatePath("/admin/achievements");
}

export async function deleteAchievement(id: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("achievements")
    .select("name")
    .eq("id", id)
    .single();

  const { error } = await admin.from("achievements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAdminAction("delete_achievement", "achievement", id, { name: data?.name });
  revalidatePath("/admin/achievements");
}

export async function awardAchievementToUser(
  userId: string,
  achievementId: string
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("user_achievements").upsert(
    { user_id: userId, achievement_id: achievementId },
    { onConflict: "user_id,achievement_id" }
  );
  if (error) throw new Error(error.message);

  await logAdminAction("award_achievement", "user", userId, { achievementId });
  revalidatePath("/admin/users");
}

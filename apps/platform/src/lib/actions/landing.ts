"use server";

import { createClient } from "@/lib/supabase/server";

export interface LandingStats {
  totalUsers: number;
  totalPosts: number;
  techCount: number;
  countryCount: number;
}

export async function getLandingStats(): Promise<LandingStats> {
  try {
    const supabase = await createClient();

    const [profilesRes, postsRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }),
    ]);

    return {
      totalUsers: profilesRes.count ?? 0,
      totalPosts: postsRes.count ?? 0,
      techCount: 50,
      countryCount: 30,
    };
  } catch {
    return { totalUsers: 0, totalPosts: 0, techCount: 50, countryCount: 30 };
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Plan = "free" | "pro" | "team";
type ToolName =
  | "code_review"
  | "readme_gen"
  | "commit_gen"
  | "code_convert"
  | "interview";

interface LimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  plan: Plan;
  upgradeRequired?: boolean;
}

const FREE_LIMITS: Record<ToolName, number> = {
  code_review: 3,
  readme_gen: 2,
  commit_gen: 5,
  code_convert: 2,
  interview: 3,
};

function getLimitForPlan(plan: Plan, tool: ToolName): number {
  if (plan === "pro" || plan === "team") return Number.MAX_SAFE_INTEGER;
  return FREE_LIMITS[tool];
}

function dayRangeUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return "free";
  if (data.status !== "active" && data.status !== "trialing") return "free";

  return (data.plan as Plan) ?? "free";
}

export async function checkLimit(userId: string, tool: ToolName): Promise<LimitResult> {
  const admin = createAdminClient();
  const plan = await getUserPlan(userId);
  const limit = getLimitForPlan(plan, tool);
  const { start, end } = dayRangeUtc();

  const { count } = await admin
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tool", tool)
    .gte("created_at", start)
    .lt("created_at", end);

  const used = count ?? 0;
  const remaining = limit === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.max(0, limit - used);
  const allowed = limit === Number.MAX_SAFE_INTEGER ? true : used < limit;

  return {
    allowed,
    used,
    limit,
    remaining,
    plan,
    upgradeRequired: !allowed && plan === "free",
  };
}

export async function trackUsage(userId: string, tool: ToolName, tokensUsed = 0) {
  const admin = createAdminClient();
  const { error } = await admin.from("usage_tracking").insert({
    user_id: userId,
    tool,
    tokens_used: Math.max(0, tokensUsed),
  });
  if (error) throw new Error(error.message);
}

export async function getUsageStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { start, end } = dayRangeUtc();
  const { data, error } = await admin
    .from("usage_tracking")
    .select("tool,tokens_used,created_at")
    .eq("user_id", user.id)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

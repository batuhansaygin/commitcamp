import { createClient } from "@/lib/supabase/server";
import { getUserDailyUsage } from "@/lib/ai/rate-limiter";
import { RATE_LIMIT } from "@/lib/ai/config";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({
      used: 0,
      remaining: RATE_LIMIT.maxRequestsPerUser,
    });
  }

  const usage = getUserDailyUsage(user.id);
  return Response.json({ ...usage, total: RATE_LIMIT.maxRequestsPerUser });
}

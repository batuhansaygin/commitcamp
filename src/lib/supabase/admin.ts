import { createClient } from "@supabase/supabase-js";

/**
 * Admin/service-role Supabase client. Use ONLY on the server.
 * This bypasses RLS — use with extreme caution.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

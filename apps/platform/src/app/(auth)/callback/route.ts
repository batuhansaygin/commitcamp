import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncProviderDataToProfile } from "@/lib/actions/linked-accounts";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/feed`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Auto-populate profile fields from the linked OAuth provider.
      // This covers both fresh sign-ups and when a user links a new provider.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await syncProviderDataToProfile(user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncProviderDataToProfile } from "@/lib/actions/linked-accounts";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup" for email verification
  const next = searchParams.get("next") ?? `/feed`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await syncProviderDataToProfile(user.id);
      }

      // Email confirmation → show welcome/success page before entering the app
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/email-verified`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

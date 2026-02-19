import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

function getBaseUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(request.url).origin;
}

/** GET: Exchange Discord code for token, fetch user, update profile, redirect to settings. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = getBaseUrl(request);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "en/settings";

  if (!code || !DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return NextResponse.redirect(`${baseUrl}/${next}?error=discord_config`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/${next}?error=not_logged_in`);
  }

  const redirectUri = `${baseUrl}/api/auth/discord/callback`;
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/${next}?error=discord_token`);
  }
  const tokenData = (await tokenRes.json()) as { access_token: string };
  const accessToken = tokenData.access_token;

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    return NextResponse.redirect(`${baseUrl}/${next}?error=discord_user`);
  }
  const discordUser = (await userRes.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
  };
  const discordUsername = discordUser.global_name ?? discordUser.username;

  const { error } = await supabase
    .from("profiles")
    .update({
      discord_user_id: discordUser.id,
      discord_username: discordUsername,
      allow_private_messages: true,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.redirect(`${baseUrl}/${next}?error=discord_save`);
  }

  return NextResponse.redirect(`${baseUrl}/${next}?discord=connected`);
}

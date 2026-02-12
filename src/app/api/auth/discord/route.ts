import { NextResponse } from "next/server";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

/** Base URL for OAuth redirect — must match Discord Developer Portal > OAuth2 > Redirects exactly (scheme, host, port, path). */
function getBaseUrl(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(request.url).origin;
}

/** GET: Redirect to Discord OAuth2 authorize. User must be logged in; callback will read session. */
export async function GET(request: Request) {
  if (!DISCORD_CLIENT_ID) {
    return NextResponse.json(
      { error: "Discord OAuth not configured" },
      { status: 503 }
    );
  }
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;
  const scope = "identify";
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  return NextResponse.redirect(url.toString());
}

# Discord Messaging Setup

> CommitCamp uses Discord for private messaging: users connect their Discord in Settings; "Message" on a profile opens Discord (user profile / DMs).

Last updated: 2026-02-12

## 1. Create a Discord application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) and sign in.
2. Click **New Application**, name it (e.g. "CommitCamp"), create.
3. Open **OAuth2 > General**. Copy **Client ID** and **Client Secret**.
4. Under **OAuth2 > Redirects**, add your callback URL:
   - Local: `http://localhost:3000/api/auth/discord/callback`
   - Production: `https://your-domain.com/api/auth/discord/callback`

## 2. Environment variables

Add to `.env.local`:

```env
# Required so redirect_uri matches Discord Portal exactly (avoids "invalid OAuth")
NEXT_PUBLIC_SITE_URL=http://localhost:3000

DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

Never expose the client secret to the browser; it is only used in the callback API route.

**Important:** `NEXT_PUBLIC_SITE_URL` must be the same origin you use in Discord Redirects (e.g. `http://localhost:3000` with no trailing slash). The app will use `{NEXT_PUBLIC_SITE_URL}/api/auth/discord/callback` as `redirect_uri`; that exact URL must be added in Discord Developer Portal > OAuth2 > Redirects.

## 3. Apply migration

Ensure the `profiles` table has the Discord columns:

```bash
npx supabase db push
```

This applies `00007_profiles_discord_messaging.sql` (adds `allow_private_messages`, `discord_user_id`, `discord_username`).

## 4. Flow

- **Settings**: User turns on "Allow private messages", then clicks "Connect with Discord". They are sent to Discord OAuth (scope `identify`). After authorizing, the callback stores their Discord user id and username and sets `allow_private_messages = true`.
- **Profile**: If the viewed user has connected Discord, the "Message" button appears and links to `https://discord.com/users/{discord_user_id}`. The other user can open Discord and start a DM from there.
- **/messages**: Static page explaining that messaging is via Discord and linking to Settings and Forum.

## See also

- [Discord OAuth2 docs](https://discord.com/developers/docs/topics/oauth2)
- `md/project-log.md` — Discord messaging changelog

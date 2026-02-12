# Discord Developer Portal — URLs

> URLs to use in Discord application settings (replace domain when using commitcamp.com in production).

Last updated: 2026-02-12

## Production (commitcamp.com)

| Field | URL |
|-------|-----|
| **Interactions Endpoint URL** | `https://commitcamp.com/api/interactions` |
| **Linked Roles Verification URL** | `https://commitcamp.com/en/verify-user` |
| **Terms of Service URL** | `https://commitcamp.com/en/terms` |
| **Privacy Policy URL** | `https://commitcamp.com/en/privacy` |

## Local (development)

| Field | URL |
|-------|-----|
| **Interactions Endpoint URL** | `http://localhost:3000/api/interactions` |
| **Linked Roles Verification URL** | `http://localhost:3000/en/verify-user` |
| **Terms of Service URL** | `http://localhost:3000/en/terms` |
| **Privacy Policy URL** | `http://localhost:3000/en/privacy` |

## Notes

- **Interactions**: Responds with PONG to Discord PING (type 1). Can be extended later for slash commands.
- **Verify-user**: For Linked Roles; users are redirected here to sign in and complete verification.
- **Terms / Privacy**: Available with `en` or `tr` (e.g. `/tr/terms`, `/tr/privacy`). Use `/en/terms` and `/en/privacy` for Discord.

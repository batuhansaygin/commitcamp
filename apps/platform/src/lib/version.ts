/**
 * CommitCamp — Version manifest
 *
 * Versioning rules:
 *  - Bump MINOR (0.x.0) for every significant feature release or important fix that ships to users
 *  - Bump PATCH (0.0.x) only when explicitly released as a meaningful patch
 *  - Do NOT bump for small in-progress bug fixes or refactors
 *  - Graduate to v1.0.0 on first stable public deployment
 *
 * Stage labels:
 *  "alpha"  → heavy development, breaking changes expected
 *  "beta"   → feature-complete, stabilisation phase
 *  "rc"     → release candidate, final testing
 *  ""       → stable / production
 */

export const VERSION = "0.9.0" as const;
export const STAGE = "alpha" as const;

/** Full display string, e.g. "v0.9.0-alpha" */
export const VERSION_LABEL = STAGE ? `v${VERSION}-${STAGE}` : `v${VERSION}`;

/** Short display string shown in the UI badge, e.g. "v0.9 alpha" */
export const VERSION_SHORT = `v${VERSION.split(".").slice(0, 2).join(".")}`;

// ─── Changelog ────────────────────────────────────────────────────────────────
// Increment VERSION when adding an entry here.
//
// v0.9.0  — Coding challenge system (challenges, duels, contests, leaderboards)
//           AI Assistant (Gemini 2.0 Flash + Groq Llama 3.3 70B, streaming fixed)
//           UI polish pass — challenge cards, filter UI, submission modal
// v0.8.0  — Achievement & badge system (74 achievements, streaks, XP tiers)
//           Feed, profiles, follow system, settings
// v0.7.0  — Forum + comments, snippets CRUD, reactions, bookmarks
// v0.6.0  — Auth (email, GitHub, Google, Discord), Supabase RLS, admin skeleton
// v0.5.0  — Project rebrand DevToolbox → CommitCamp
//           8 developer tools migrated, i18n EN/TR → EN-only

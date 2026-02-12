# CommitCamp — Project Log

> Complete development log for commitcamp.com — Developer Tools & Community platform.

Last updated: 2026-02-12

## Table of Contents
- [Overview](#overview)
- [Rebranding](#rebranding)
- [Phase 1: Foundation + Tool Migration](#phase-1-foundation--tool-migration)
- [Phase 1.5: Auth + Database](#phase-15-auth--database)
- [Phase 2: Social Features](#phase-2-social-features)

## Overview

**CommitCamp** (commitcamp.com) is a developer tools & community platform built with:
- **Framework**: Next.js 16 (App Router, RSC, TypeScript strict)
- **UI**: shadcn/ui + Tailwind CSS v4 + Radix UI
- **Auth**: Supabase Auth (Email, GitHub, Google, Discord)
- **Database**: Supabase PostgreSQL + RLS (8 tables, 5 migrations)
- **i18n**: next-intl (EN/TR)
- **Theme**: next-themes (dark/light with glassmorphism)
- **Domain**: commitcamp.com

## Rebranding

### 2026-02-12 — DevToolbox → CommitCamp
- Purchased domain: commitcamp.com
- Renamed project from "DevToolbox" to "CommitCamp" across entire codebase
- Updated package.json name to "commitcamp"
- Added full Open Graph + Twitter Card metadata with commitcamp.com
- Updated all translation files (EN/TR) — appName, taglines, descriptions
- Updated all hardcoded strings in 17 files:
  - Layout components (header, footer, sidebars)
  - Auth forms (login, signup)
  - Tool sample data (JSON formatter, JWT decoder)
  - Admin pages and metadata
  - Tools index page
- Updated .env.example with CommitCamp branding
- Added Supabase Storage image pattern to next.config.ts
- New tagline: "Where developers commit to growth"
- Zero remaining "DevToolbox" references in source code

## Phase 1: Foundation + Tool Migration

### 2026-02-12 — Project Setup & Migration
- Migrated from Vite + vanilla JS to Next.js 16 + TypeScript strict
- Set up project structure with Clean Architecture principles
- Configured Tailwind CSS v4 with custom design tokens (glassmorphism preserved)
- Set up next-intl for EN/TR internationalization
- Set up next-themes for dark/light mode
- Created shadcn/ui components manually (Button, Card, Badge, Tabs)
- Created layout components (Header, Footer, ToolsSidebar, PlatformSidebar, BackButton)
- Migrated all 8 developer tools to React client components:
  1. JSON Formatter — format, validate, minify with syntax highlighting
  2. Regex Tester — real-time pattern matching with flag toggles
  3. Base64 / URL Encoder — tabbed interface, URL-safe option
  4. Color Converter — HEX/RGB/HSL with palette generator
  5. UUID & Hash Generator — bulk UUID, SHA-1/256/384/512
  6. JWT Decoder — header/payload/signature with expiry check
  7. Timestamp Converter — live clock, bidirectional conversion
  8. Lorem Ipsum Generator — paragraphs/sentences/words with options
- Created landing page with hero, features section, tools grid
- All tool pages have back buttons (except landing page)
- Responsive design with mobile-first sidebar

## Phase 1.5: Auth + Database

### 2026-02-12 — Supabase Integration
- Created Supabase client utilities (browser, server, admin)
- Combined middleware: next-intl locale routing + Supabase session refresh
- Protected routes redirect unauthenticated users to login
- Auth pages: login, signup with email/password + OAuth (GitHub, Google, Discord)
- User menu in header with avatar, role badge, sign out
- OAuth callback route handler

### 2026-02-12 — Database Schema (5 migrations, 8 tables)
1. **profiles** — extends auth.users (username, display_name, bio, avatar_url, role)
2. **snippets** — code sharing (title, language, code, is_public)
3. **posts** — forum (title, content, type, tags, is_solved)
4. **comments** — polymorphic threaded comments (snippet/post)
5. **reactions** — polymorphic reactions (like/fire/rocket/heart)
6. **bookmarks** — polymorphic bookmarks (snippet/post)
7. **follows** — follow system with self-follow prevention
8. **messages** — DM with read_at timestamp

All tables have RLS policies. No unnecessary columns or foreign keys.
Auto-sync trigger: auth.users → profiles on signup.

### 2026-02-12 — Admin Panel
- Admin layout with sidebar navigation
- Dashboard page with stats grid (Users, Snippets, Posts, Views)
- User management page (skeleton)
- Reports page (skeleton)
- Admin link in footer
- Role-based access in middleware

## Phase 2: Social Features

### Phase 2A: Code Sharing (Completed 2026-02-12)
- **Types**: `src/lib/types/snippets.ts` — Snippet, SnippetWithAuthor, SNIPPET_LANGUAGES (22 languages)
- **Validation**: `src/lib/validations/snippets.ts` — Zod schema with createSnippetSchema
- **Server Actions**: `src/lib/actions/snippets.ts` — getSnippets, getSnippetById, createSnippet, deleteSnippet
- **Components** (4 files in `src/components/snippets/`):
  - `snippet-form.tsx` — Form with validation, language selector, useActionState
  - `snippet-card.tsx` — Card for listing view with code preview, author, time ago
  - `code-block.tsx` — Code display with copy button and language header
  - `snippet-actions.tsx` — Delete button with confirmation for snippet author
- **Pages** (3 updated):
  - `/snippets` — Listing page, fetches public snippets from Supabase with author join
  - `/snippets/new` — Functional form with server action, redirects on success
  - `/snippets/[id]` — Detail page with code block, author info, dynamic metadata
- **Loading states**: `loading.tsx` for listing and detail pages (skeleton UI)
- **i18n**: 16 new translation keys added to both EN and TR
- **No new database tables** — uses existing `snippets` table with RLS
- Build: 0 errors, all pages compile correctly

### Phase 2B: Forum + Comments (Completed 2026-02-12)
- **Types**: `src/lib/types/posts.ts` — Post, PostWithAuthor, Comment, CommentWithAuthor, POST_TYPES
- **Validation**: `src/lib/validations/posts.ts` — createPostSchema (tags auto-parse), createCommentSchema
- **Server Actions**:
  - `src/lib/actions/posts.ts` — getPosts (with type filter), getPostById, createPost, deletePost, toggleSolved
  - `src/lib/actions/comments.ts` — getComments (polymorphic: post/snippet), addComment
- **Components** (5 files in `src/components/forum/`):
  - `post-form.tsx` — Form with type selector, tags input, useActionState
  - `post-card.tsx` — Card with type badge, solved indicator, tags, author
  - `post-actions.tsx` — Delete (with confirm) + Mark Solved toggle for questions
  - `forum-tabs.tsx` — Type filter tabs (All / Discussion / Question / Showcase)
  - `comment-section.tsx` — Comments list + add comment form (reusable for posts & snippets)
- **Pages** (3 updated):
  - `/forum` — Listing with type filter tabs via searchParams
  - `/forum/new` — Functional form with server action, redirects on success
  - `/forum/[id]` — Detail with content, comments, author actions, dynamic metadata
- **Loading states**: `loading.tsx` for listing and detail pages (skeleton UI)
- **i18n**: 28 new translation keys added to both EN and TR
- **No new database tables** — uses existing `posts` + `comments` tables with RLS
- Build: 0 errors, all pages compile correctly

### Phase 2C: Profiles + Follow + Feed (Completed 2026-02-12)
- **Types**: `src/lib/types/profiles.ts` — Profile, ProfileWithStats
- **Validation**: `src/lib/validations/profiles.ts` — updateProfileSchema (username regex, bio max 300)
- **Server Actions**:
  - `src/lib/actions/profiles.ts` — getProfileByUsername (with stats), getCurrentProfile, getUserSnippets, getUserPosts, updateProfile
  - `src/lib/actions/follows.ts` — isFollowing, followUser, unfollowUser
  - `src/lib/actions/feed.ts` — getFeedPosts, getFeedSnippets (from followed users)
- **Components** (3 files in `src/components/profile/`):
  - `profile-header.tsx` — Avatar, name, role badge, bio, follower/following/content stats
  - `follow-button.tsx` — Follow/Unfollow with optimistic state
  - `settings-form.tsx` — Profile edit form with success/error feedback
- **Pages** (3 updated):
  - `/profile/[username]` — Public profile with stats, snippets, posts, follow button
  - `/settings` — Functional settings form with server action, unique username check
  - `/feed` — Posts & snippets from followed users, empty state with explore links
- **Loading states**: `loading.tsx` for profile and feed pages
- **i18n**: 30+ new translation keys added to both EN and TR
- **No new database tables** — uses existing `profiles`, `follows`, `snippets`, `posts`
- Build: 0 errors

### Phase 2D: Messaging (Completed 2026-02-12)
- **Types**: `src/lib/types/messages.ts` — Message, Conversation (with unread count)
- **Validation**: `src/lib/validations/messages.ts` — sendMessageSchema
- **Server Actions** (`src/lib/actions/messages.ts`):
  - `getConversations` — Inbox view: groups messages by other user, counts unread, shows latest message
  - `getThread` — Full thread between two users, auto-marks unread as read
  - `sendMessage` — Send DM with validation
- **Components** (3 files in `src/components/messages/`):
  - `conversation-list.tsx` — Inbox: avatar, name, last message preview, unread badge, time ago
  - `message-thread.tsx` — Chat bubbles with date separators, read receipts (single/double check)
  - `message-input.tsx` — Round input with send button, auto-clear on success
- **Pages** (2 pages):
  - `/messages` — Conversation inbox with empty state
  - `/messages/[username]` — Full-height chat thread with header linking to profile
- **Loading states**: `loading.tsx` for inbox and thread
- **i18n**: 10 new translation keys added to both EN and TR
- **No new database tables** — uses existing `messages` table with RLS
- **Supabase Realtime ready** — table structure supports real-time subscriptions
- Build: 0 errors

### 2026-02-12 — Profile "Send Message" + KVKK Note
- **Profile page**: "Send Message" button added on other users' profiles (not shown on own profile).
- **ProfileHeader**: Optional `messageButton` prop added; button links to `/messages/[username]`.
- **i18n**: `profile.sendMessage` — EN: "Message", TR: "Mesaj Gönder".
- **KVKK**: `md/kvkk-mesajlar.md` added — Summary of why storing messages in DB is not contrary to KVKK, and requirements for privacy notice, legal basis, security, and deletion policy.

### 2026-02-12 — All Markdown in English
- **Policy**: All `.md` files must be written in English; existing Turkish content translated to English.
- **Updated**: `md/kvkk-mesajlar.md` — Full translation to English (KVKK doc).
- **Updated**: `md/project-log.md` — Turkish bullet in "Profile Send Message" section translated to English.
- **Rule**: `.cursor/rules/project-context.mdc` — Added "all .md content must be in English".

### 2026-02-12 — Messaging via Discord (replace Stream Chat)
- **Discord OAuth**: Messaging is via Discord; no in-app chat. Users enable “Allow private messages” in Settings and connect Discord; profile “Message” opens `https://discord.com/users/{discord_user_id}`.
- **Migration**: `00007_profiles_discord_messaging.sql` — Adds `allow_private_messages`, `discord_user_id`, `discord_username` to `profiles`.
- **API routes**: `GET /api/auth/discord` (redirect to Discord OAuth), `GET /api/auth/discord/callback` (exchange code, update profile, set `allow_private_messages = true`).
- **Settings**: New “Messaging” card with “Allow private messages” switch; when on, “Connect with Discord” button (or “Connected as …” + Disconnect). `updateAllowPrivateMessages()`, `disconnectDiscord()` in `lib/actions/profiles.ts`.
- **Profile**: “Message” button only if `profile.discord_user_id`; link is external to Discord user profile.
- **Messages pages**: `/messages` is static CTA (Open Settings, Browse Forum); `/messages/[username]` redirects to Discord user URL or 404.
- **Removed**: Stream Chat (package, `lib/stream`, `lib/actions/stream.ts`, stream-provider, messages-inbox, message-thread-stream, message-input-stream). Stream env vars removed from `.env.example`.
- **Env**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (see `.env.example`). Redirect URI: `{origin}/api/auth/discord/callback`.
- **UI**: Added `Label` and `Switch` components for settings.

## Architecture

### Route Structure (45 pages, EN/TR)
```
/                              → Landing page
/tools/*                       → 8 developer tools (public)
/login, /signup, /callback     → Auth pages
/feed                          → User feed (protected)
/snippets, /snippets/new       → Code sharing (protected)
/forum, /forum/new             → Forum (protected)
/messages                      → DM (protected)
/profile/[username]            → User profiles
/settings                      → User settings (protected)
/admin/*                       → Admin panel (admin role)
```

## See Also
- Domain: https://commitcamp.com
- Migrations: `supabase/migrations/`
- Translations: `src/messages/en.json`, `src/messages/tr.json`

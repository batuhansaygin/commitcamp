<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</p>

# CommitCamp

**Where developers commit to growth.**

CommitCamp is an open-source developer tools and community platform. It combines 8 powerful client-side developer utilities with social features like code sharing, forums, direct messaging, and user profiles — all built with Next.js 16, Supabase, and TypeScript.

All developer tools run **entirely in the browser** — no data is ever sent to any server.

<p align="center">
  <a href="https://commitcamp.com">Live Demo</a> &middot;
  <a href="#contributing">Contribute</a> &middot;
  <a href="https://github.com/batuhansaygin/commitcamp/issues">Report Bug</a> &middot;
  <a href="https://github.com/batuhansaygin/commitcamp/issues">Request Feature</a>
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Internationalization](#internationalization)
- [Contributing](#contributing)
- [Adding a New Tool](#adding-a-new-tool)
- [Development Workflow](#development-workflow)
- [License](#license)

---

## Features

### Developer Tools

All tools are **client-side only** — your data never leaves your browser.

| Tool | Description |
|------|-------------|
| **JSON Formatter** | Format, validate, and minify JSON with syntax highlighting |
| **Regex Tester** | Test regular expressions with real-time match highlighting |
| **Base64 Encoder** | Encode and decode Base64 and URL strings |
| **Color Converter** | Convert between HEX, RGB, HSL with palette generation |
| **UUID Generator** | Generate UUID v4 and hash-based identifiers |
| **JWT Decoder** | Decode JWT tokens with header, payload, and expiry info |
| **Timestamp Converter** | Convert between Unix timestamps and human-readable dates |
| **Lorem Generator** | Generate Lorem Ipsum placeholder text |

### Community Platform

- **Code Snippets** — Share and discover code with syntax highlighting
- **Forum** — Discussions, questions, and project showcases with tags
- **Direct Messages** — Real-time messaging between developers
- **User Profiles** — Public profiles with follow system
- **Reactions & Bookmarks** — Like, fire, rocket, heart reactions on all content
- **Threaded Comments** — Nested comment system on posts and snippets

### Admin Panel

- User management with role-based access control
- Content moderation and reports dashboard

### More

- Dark / Light / System theme with glassmorphism effects
- Bilingual interface (English & Turkish)
- Fully responsive, mobile-first design
- OAuth login via GitHub, Google, and Discord

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) — App Router, React Server Components |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) — Strict mode |
| **UI** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Backend** | [Supabase](https://supabase.com/) — Auth, PostgreSQL, Storage |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Fonts** | Inter + JetBrains Mono |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.17+
- [npm](https://www.npmjs.com/) (or pnpm / yarn)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A free [Supabase](https://supabase.com/) project

### 1. Clone the Repository

```bash
git clone https://github.com/batuhansaygin/commitcamp.git
cd commitcamp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these in your Supabase dashboard: **Settings > API**.

### 4. Set Up the Database

```bash
# Link your Supabase project
npx supabase link --project-ref your-project-ref

# Apply all migrations
npx supabase db push
```

### 5. Configure OAuth Providers (Optional)

To enable GitHub, Google, and Discord login, configure the providers in your Supabase dashboard under **Authentication > Providers**.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
commitcamp/
├── src/
│   ├── app/
│   │   └── [locale]/                 # Internationalized routes (en, tr)
│   │       ├── (tools)/              #   Developer tools — public
│   │       │   └── tools/
│   │       │       ├── json-formatter/
│   │       │       ├── regex-tester/
│   │       │       ├── base64-encoder/
│   │       │       ├── color-converter/
│   │       │       ├── uuid-generator/
│   │       │       ├── jwt-decoder/
│   │       │       ├── timestamp-converter/
│   │       │       └── lorem-generator/
│   │       ├── (auth)/               #   Login, signup, OAuth callback
│   │       ├── (platform)/           #   Community — protected
│   │       │   ├── feed/
│   │       │   ├── forum/
│   │       │   ├── snippets/
│   │       │   ├── messages/
│   │       │   ├── profile/
│   │       │   └── settings/
│   │       └── (admin)/              #   Admin panel — admin role
│   │           └── admin/
│   ├── components/
│   │   ├── auth/                     # Login, signup, OAuth, user menu
│   │   ├── layout/                   # Header, footer, sidebars
│   │   ├── tools/                    # 8 developer tool components
│   │   └── ui/                       # shadcn/ui base components
│   ├── hooks/                        # Custom React hooks
│   ├── i18n/                         # Internationalization config
│   ├── lib/
│   │   ├── supabase/                 # Browser, server, admin clients
│   │   ├── validations/              # Zod schemas
│   │   └── utils.ts                  # Shared utilities
│   ├── messages/                     # Translation files (en.json, tr.json)
│   └── middleware.ts                 # Auth + i18n middleware
├── supabase/
│   └── migrations/                   # 5 SQL migration files
├── md/                               # Project documentation
└── public/                           # Static assets
```

---

## Database Schema

All tables have **Row Level Security (RLS)** enabled.

| Migration | Tables | Purpose |
|-----------|--------|---------|
| `00001_create_profiles` | `profiles` | User profiles extending auth.users (username, bio, role) |
| `00002_create_snippets` | `snippets` | Shared code snippets with language and visibility |
| `00003_create_posts` | `posts` | Forum posts (discussion, question, showcase) with tags |
| `00004_create_interactions` | `comments`, `reactions`, `bookmarks` | Threaded comments, reactions, and bookmarks |
| `00005_create_social` | `follows`, `messages` | Follow system and direct messaging |

### User Roles

| Role | Description |
|------|-------------|
| `user` | Default role for all registered users |
| `moderator` | Can moderate content |
| `admin` | Full access to admin panel and user management |

---

## Internationalization

CommitCamp supports **English** and **Turkish**. Translation files live in `src/messages/`.

### Adding a New Language

1. Copy `src/messages/en.json` to `src/messages/{locale}.json`
2. Translate all keys
3. Register the locale in `src/i18n/routing.ts`:

```typescript
export const routing = defineRouting({
  locales: ['en', 'tr', 'your-locale'],
  defaultLocale: 'en'
});
```

4. Submit a PR!

---

## Contributing

CommitCamp is built by the community, for the community. All contributions are welcome — whether it's fixing a bug, adding a new developer tool, translating the app, or improving the UI.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make** your changes
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add markdown preview tool"
   ```
5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** with a clear description

### Commit Message Prefixes

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, UI changes |
| `refactor:` | Code restructuring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance, dependencies |
| `i18n:` | Translation updates |

### Contribution Ideas

- **New Developer Tools** — Markdown preview, CSS minifier, diff checker, YAML validator, cron expression parser, etc.
- **Translations** — Add support for new languages (German, Spanish, French, Japanese...)
- **UI/UX** — Improve responsive design, animations, accessibility
- **Bug Fixes** — Check the [Issues](https://github.com/batuhansaygin/commitcamp/issues) tab
- **Documentation** — Improve guides and examples
- **Testing** — Unit tests, integration tests, E2E tests
- **Performance** — Optimize components, reduce bundle size

### Code Style Guidelines

- **TypeScript** strict mode — no `any` types
- **React Server Components** by default — use `'use client'` only when necessary
- **shadcn/ui** for all UI components
- **Tailwind CSS** for styling — follow existing spacing patterns
- **Zod** for all form and input validation
- Meaningful variable and function names in English

---

## Adding a New Tool

Want to add a new developer tool? Here's how:

### 1. Create the Component

Create `src/components/tools/your-tool.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function YourTool() {
  const t = useTranslations('tools.yourTool');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your tool UI here */}
      </CardContent>
    </Card>
  );
}
```

### 2. Create the Route

Create `src/app/[locale]/(tools)/tools/your-tool/page.tsx`:

```tsx
import { setRequestLocale } from 'next-intl/server';
import { YourTool } from '@/components/tools/your-tool';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function YourToolPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <YourTool />;
}
```

### 3. Add Translations

Add entries to both `src/messages/en.json` and `src/messages/tr.json`:

```json
{
  "tools": {
    "yourTool": {
      "title": "Your Tool Name",
      "description": "Brief description of what it does"
    }
  }
}
```

### 4. Register in Sidebar

Add the tool to `src/components/layout/tools-sidebar.tsx`.

### 5. Submit a PR!

---

## Development Workflow

### Branch Naming

| Pattern | Usage |
|---------|-------|
| `feature/tool-name` | New developer tool |
| `feature/description` | New feature |
| `fix/bug-description` | Bug fix |
| `i18n/language-code` | New language |
| `docs/description` | Documentation |

### Database Changes

All database changes **must** go through migrations — never edit the database manually.

```bash
# Create a new migration
npx supabase migration new your_migration_name

# Apply migrations
npx supabase db push
```

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with passion by the CommitCamp community.<br/>
  <strong>Where developers commit to growth.</strong>
</p>

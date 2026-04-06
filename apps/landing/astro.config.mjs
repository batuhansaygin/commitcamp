import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/** Canonical marketing domain (sitemap, Astro.site, meta/JSON-LD). Do not point this at localhost. */
const site = 'https://commitcamp.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [
    tailwind(),
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const base = site.replace(/\/$/, '');
        try {
          const u = new URL(item.url);
          const path = u.pathname.replace(/\/$/, '') || '/';
          if (path === '/') {
            return { ...item, priority: 1, changefreq: 'daily' };
          }
          if (path.startsWith('/tools')) {
            return { ...item, priority: 0.85, changefreq: 'weekly' };
          }
          if (path.startsWith('/tr')) {
            return { ...item, priority: 0.9, changefreq: 'weekly' };
          }
        } catch {
          /* ignore */
        }
        return item;
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

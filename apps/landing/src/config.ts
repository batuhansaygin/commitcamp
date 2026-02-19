export const config = {
  platformUrl: import.meta.env.PUBLIC_PLATFORM_URL ?? 'https://app.commitcamp.com',
  siteUrl: import.meta.env.PUBLIC_SITE_URL ?? 'https://commitcamp.com',
} as const;

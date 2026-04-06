function normalizeSiteOrigin(siteOrigin: string): string {
  return siteOrigin.replace(/\/$/, "");
}

/** Safe for embedding in <script type="application/ld+json"> */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Use `Astro.site.origin` from pages/layout so canonical matches `site` in astro.config. */
export function toAbsoluteUrl(siteOrigin: string, pathname: string): string {
  const base = normalizeSiteOrigin(siteOrigin);
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path.length > 1 && !path.endsWith("/")) path += "/";
  return `${base}${path}`;
}

export function homeAlternates(siteOrigin: string): { hreflang: string; href: string }[] {
  return [
    { hreflang: "en", href: toAbsoluteUrl(siteOrigin, "/") },
    { hreflang: "tr", href: toAbsoluteUrl(siteOrigin, "/tr/") },
    { hreflang: "x-default", href: toAbsoluteUrl(siteOrigin, "/") },
  ];
}

export function buildHomeJsonLd(input: {
  siteOrigin: string;
  lang: "en" | "tr";
  title: string;
  description: string;
  canonicalPath: string;
}): Record<string, unknown> {
  const SITE = normalizeSiteOrigin(input.siteOrigin);
  const inLanguage = input.lang === "tr" ? "tr" : "en";
  const canonical = toAbsoluteUrl(input.siteOrigin, input.canonicalPath);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "CommitCamp",
        url: SITE,
        description:
          input.lang === "tr"
            ? "Geliştiriciler için sosyal platform: kod paylaşımı, topluluk ve AI araçları."
            : "Social platform for developers: code sharing, community, and AI tools.",
        logo: `${SITE}/favicon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${canonical}#website`,
        url: canonical,
        name: input.title.split("—")[0]?.trim() ?? "CommitCamp",
        description: input.description,
        inLanguage,
        publisher: { "@id": `${SITE}/#organization` },
      },
    ],
  };
}

export function buildToolPageJsonLd(
  siteOrigin: string,
  input: {
    name: string;
    description: string;
    landingPath: string;
  }
): Record<string, unknown> {
  const pageUrl = toAbsoluteUrl(siteOrigin, input.landingPath);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: input.name,
        description: input.description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: toAbsoluteUrl(siteOrigin, "/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: input.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}

import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? "https://commitcamp.com";
  const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap-index.xml
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};

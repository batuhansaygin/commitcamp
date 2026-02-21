import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build or when env vars are not set, return a dummy that
    // won't make real API calls but won't crash during SSR prerender.
    // All auth methods will return errors gracefully.
    browserClient = createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
    return browserClient;
  }

  browserClient = createBrowserClient(url, key);
  return browserClient;
}

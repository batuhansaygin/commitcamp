import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication
const PROTECTED_ROUTES = ["/feed", "/snippets/new", "/messages", "/settings", "/admin"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.includes(route));
}

export async function middleware(request: NextRequest) {
  // 1. Run intl middleware first for locale handling
  const intlResponse = intlMiddleware(request);

  // 2. Create Supabase client with cookie handling
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, skip auth checks
  if (!url || !key) {
    return intlResponse;
  }

  const supabase = createServerClient(url, key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            intlResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Refresh session (important for server components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Protect routes that require auth
  const { pathname } = request.nextUrl;
  if (isProtectedRoute(pathname) && !user) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Redirect logged-in users away from auth pages to feed
  if (user && (pathname.includes("/login") || pathname.includes("/signup"))) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/feed`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/",
    "/(en|tr)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

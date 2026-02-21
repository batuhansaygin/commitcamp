import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = [
  "/feed",
  "/snippets/new",
  "/messages",
  "/settings",
];

const ADMIN_ROUTES = ["/admin"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.includes(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

const LOCALE_PREFIXES = ["/en", "/tr"];

function getEffectivePath(pathname: string): { path: string; hasLocale: boolean } {
  const prefix = LOCALE_PREFIXES.find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!prefix) return { path: pathname, hasLocale: false };
  const path = pathname === prefix ? "/" : pathname.slice(prefix.length) || "/";
  return { path, hasLocale: true };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { path: effectivePath, hasLocale } = getEffectivePath(pathname);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (hasLocale) {
      const url = request.nextUrl.clone();
      url.pathname = effectivePath;
      return NextResponse.rewrite(url);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users → redirect to login (use effective path for redirect)
  if ((isProtectedRoute(effectivePath) || isAdminRoute(effectivePath)) && !user) {
    const loginUrl = new URL(hasLocale ? "/en/login" : "/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes → require admin or system_admin role
  if (isAdminRoute(effectivePath) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;
    if (role !== "admin" && role !== "system_admin") {
      const feedUrl = hasLocale ? "/en/feed" : "/feed";
      return NextResponse.redirect(new URL(feedUrl, request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (effectivePath.includes("/login") || effectivePath.includes("/signup"))) {
    const feedUrl = hasLocale ? "/en/feed" : "/feed";
    return NextResponse.redirect(new URL(feedUrl, request.url));
  }

  // Rewrite /en/... and /tr/... to internal path
  if (hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePath;
    return NextResponse.rewrite(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

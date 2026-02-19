import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/submit",
    "/submissions",
    "/teams",
    "/reviews",
    "/admin",
    "/sponsor",
    "/onboarding",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Helper: create a redirect that preserves any refreshed auth cookies
  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url);
    // Forward any cookies set during getUser() (e.g., refreshed tokens)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    const redirectPath = request.nextUrl.pathname;
    if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
      redirectUrl.searchParams.set("redirect", redirectPath);
    }
    return redirectWithCookies(redirectUrl);
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === "/login" && user) {
    return redirectWithCookies(new URL("/dashboard", request.url));
  }

  // Role-based route protection — only query DB when the route needs it
  const roleProtectedPrefixes = ["/admin", "/sponsor", "/reviews"];
  const needsRoleCheck = roleProtectedPrefixes.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (user && needsRoleCheck) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, has_completed_onboarding")
      .eq("id", user.id)
      .maybeSingle();

    // Check if account was deleted (auth exists but no DB profile)
    if (!profile) {
      const createdAt = new Date(user.created_at);
      const accountAgeMs = Date.now() - createdAt.getTime();
      const isNewAccount = accountAgeMs < 5 * 60 * 1000; // 5 minutes

      if (!isNewAccount) {
        await supabase.auth.signOut();
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "account_deleted");
        return redirectWithCookies(redirectUrl);
      }
    }

    // Onboarding redirect for role-protected routes
    if (profile && !profile.has_completed_onboarding) {
      return redirectWithCookies(new URL("/onboarding", request.url));
    }

    const role = profile?.role;

    // Admin routes
    if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      return redirectWithCookies(new URL("/dashboard", request.url));
    }

    // Sponsor routes
    if (request.nextUrl.pathname.startsWith("/sponsor") && role !== "sponsor" && role !== "admin") {
      return redirectWithCookies(new URL("/dashboard", request.url));
    }

    // Judge routes (reviews)
    if (request.nextUrl.pathname.startsWith("/reviews") && role !== "judge" && role !== "admin") {
      return redirectWithCookies(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};

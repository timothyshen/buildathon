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

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based route protection
  if (user) {
    // Fetch user profile to get role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Check if account was deleted (auth exists but no DB profile)
    // Allow onboarding page for new accounts that may not have profile yet
    if (!profile && !request.nextUrl.pathname.startsWith("/onboarding")) {
      // Check if this is a new account (created within last 5 minutes)
      const createdAt = new Date(user.created_at);
      const accountAgeMs = Date.now() - createdAt.getTime();
      const isNewAccount = accountAgeMs < 5 * 60 * 1000; // 5 minutes

      if (!isNewAccount) {
        // Old account with no profile = deleted account
        // Sign out and redirect to login with error
        await supabase.auth.signOut();
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "account_deleted");
        return NextResponse.redirect(redirectUrl);
      }
    }

    const role = profile?.role;

    // Admin routes
    if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Sponsor routes
    if (request.nextUrl.pathname.startsWith("/sponsor") && role !== "sponsor" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Judge routes (reviews)
    if (request.nextUrl.pathname.startsWith("/reviews") && role !== "judge" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSignedState } from "@/lib/oauth-state";

/**
 * GET /api/traction/ga/authorize
 * Initiates Google Analytics OAuth flow
 * Query params: submissionId (required)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
    }

    // Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this submission
    const { data: submission } = await supabase
      .from("submissions")
      .select("id, created_by, team_id")
      .eq("id", submissionId)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check access: creator, team member, or admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isCreator = submission.created_by === user.id;
    const isAdmin = profile?.role === "admin";

    let isTeamMember = false;
    if (submission.team_id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", submission.team_id)
        .eq("user_id", user.id)
        .maybeSingle();
      isTeamMember = !!membership;
    }

    if (!isCreator && !isTeamMember && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if Google OAuth is configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/traction/ga/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Google Analytics integration not configured" },
        { status: 503 }
      );
    }

    // Build OAuth URL with signed state to prevent CSRF
    const scope = "https://www.googleapis.com/auth/analytics.readonly";
    const state = createSignedState(submissionId, user.id);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("[GA Authorize] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

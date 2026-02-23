import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedState } from "@/lib/oauth-state";

/**
 * GET /api/traction/ga/callback
 * OAuth callback from Google - exchanges code for tokens and saves
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("[GA Callback] OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/submissions?error=ga_auth_failed&message=${encodeURIComponent(error)}`, origin)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/submissions?error=ga_auth_failed&message=Missing+code+or+state", origin)
      );
    }

    // Verify and decode signed state (prevents CSRF attacks)
    const stateData = verifySignedState(state);
    if (!stateData) {
      return NextResponse.redirect(
        new URL("/submissions?error=ga_auth_failed&message=Invalid+or+expired+state", origin)
      );
    }

    const { submissionId, userId } = stateData;

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/traction/ga/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.refresh_token) {
      console.error("[GA Callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL("/submissions?error=ga_auth_failed&message=Token+exchange+failed", origin)
      );
    }

    // Fetch GA4 properties to let user select one
    // For now, we'll get the first property and store it
    // In a production app, you'd show a property selector
    const accessToken = tokenData.access_token;

    const accountsResponse = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok) {
      console.error("[GA Callback] Failed to fetch accounts:", accountsData);
      return NextResponse.redirect(
        new URL("/submissions?error=ga_auth_failed&message=Could+not+fetch+GA+accounts", origin)
      );
    }

    // Get first GA4 property
    let propertyId: string | null = null;
    for (const account of accountsData.accountSummaries || []) {
      for (const property of account.propertySummaries || []) {
        // GA4 properties have format "properties/123456789"
        if (property.property) {
          propertyId = property.property;
          break;
        }
      }
      if (propertyId) break;
    }

    if (!propertyId) {
      return NextResponse.redirect(
        new URL("/submissions?error=ga_auth_failed&message=No+GA4+properties+found", origin)
      );
    }

    // Save to database using admin client (bypass RLS)
    const adminClient = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (adminClient as any)
      .from("submission_traction")
      .upsert(
        {
          submission_id: submissionId,
          ga_property_id: propertyId,
          ga_refresh_token: tokenData.refresh_token,
          ga_connected_at: new Date().toISOString(),
          ga_connected_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "submission_id" }
      );

    if (upsertError) {
      console.error("[GA Callback] Database error:", upsertError);
      return NextResponse.redirect(
        new URL("/submissions?error=ga_auth_failed&message=Database+error", origin)
      );
    }

    // Success - redirect back to traction page
    return NextResponse.redirect(
      new URL(`/submissions/${submissionId}/traction?ga_connected=true`, origin)
    );
  } catch (error) {
    console.error("[GA Callback] Error:", error);
    return NextResponse.redirect(
      new URL("/submissions?error=ga_auth_failed&message=Internal+error", origin)
    );
  }
}

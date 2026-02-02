import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET: Validate invite token and return org info (public, no auth needed)
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const adminClient = createAdminClient();

    const { data: invite } = await adminClient
      .from("sponsor_invites")
      .select("id, token, sponsor_org_id, email, expires_at, used_at")
      .eq("token", token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
    }

    // Get the org info
    const { data: org } = await adminClient
      .from("sponsor_orgs")
      .select("id, name, logo")
      .eq("id", invite.sponsor_org_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Sponsor organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      orgName: org.name,
      orgLogo: org.logo,
      restrictedEmail: invite.email,
    });
  } catch (error) {
    console.error("[Invites] Validate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Consume invite token — sets user role to sponsor
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

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

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch and validate the invite
    const { data: invite } = await adminClient
      .from("sponsor_invites")
      .select("id, sponsor_org_id, email, expires_at, used_at")
      .eq("token", token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ error: "This invite has already been used" }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
    }

    // If invite is restricted to a specific email, verify it matches
    if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "This invite is for a different email address" }, { status: 403 });
    }

    // Update the user's role and sponsor org
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        role: "sponsor",
        sponsor_org_id: invite.sponsor_org_id,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[Invites] User update error:", updateError);
      return NextResponse.json({ error: "Failed to assign sponsor role" }, { status: 500 });
    }

    // Mark invite as used
    await adminClient
      .from("sponsor_invites")
      .update({
        used_at: new Date().toISOString(),
        used_by: user.id,
      })
      .eq("id", invite.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Invites] Consume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

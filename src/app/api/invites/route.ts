import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
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

    // Verify the user is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { sponsorOrgId, email, expiresInDays = 7 } = body;

    if (!sponsorOrgId) {
      return NextResponse.json({ error: "sponsorOrgId is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify the sponsor org exists
    const { data: org } = await adminClient
      .from("sponsor_orgs")
      .select("id, name")
      .eq("id", sponsorOrgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Sponsor org not found" }, { status: 404 });
    }

    // Create the invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data: invite, error: insertError } = await adminClient
      .from("sponsor_invites")
      .insert({
        sponsor_org_id: sponsorOrgId,
        email: email || null,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("token")
      .single();

    if (insertError) {
      console.error("[Invites] Create error:", insertError);
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    return NextResponse.json({
      token: invite.token,
      orgName: org.name,
      expiresAt: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("[Invites] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

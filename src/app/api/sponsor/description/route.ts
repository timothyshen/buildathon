import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cohortSponsorId, description } = await request.json();

    if (!cohortSponsorId) {
      return NextResponse.json(
        { error: "Missing cohortSponsorId" },
        { status: 400 }
      );
    }

    // Verify the user is a sponsor and owns this cohort_sponsor record
    const adminClient = createAdminClient();

    const { data: userData } = await adminClient
      .from("users")
      .select("sponsor_org_id, role")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the cohort_sponsor record to verify ownership
    const { data: cohortSponsor } = await adminClient
      .from("cohort_sponsors")
      .select("sponsor_org_id")
      .eq("id", cohortSponsorId)
      .single();

    if (!cohortSponsor) {
      return NextResponse.json(
        { error: "Cohort sponsor not found" },
        { status: 404 }
      );
    }

    // Only allow the owning sponsor or admins
    if (
      userData.role !== "admin" &&
      userData.sponsor_org_id !== cohortSponsor.sponsor_org_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update description via admin client (bypasses RLS)
    const { data: updated, error: updateError } = await adminClient
      .from("cohort_sponsors")
      .update({ description: description ?? "" })
      .eq("id", cohortSponsorId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

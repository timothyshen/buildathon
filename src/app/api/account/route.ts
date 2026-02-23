import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Clean up references that lack ON DELETE CASCADE before deleting the user row
    // NOT NULL FKs — delete the rows
    await adminClient.from("team_invites").delete().eq("invited_by", user.id);
    await adminClient.from("announcements").delete().eq("author_id", user.id);
    await adminClient.from("media").delete().eq("uploaded_by", user.id);
    await adminClient.from("sponsor_invites").delete().eq("created_by", user.id);

    // Nullable FKs — set to null
    await adminClient.from("sponsor_invites").update({ used_by: null }).eq("used_by", user.id);
    await adminClient.from("submission_traction").update({ ga_connected_by: null }).eq("ga_connected_by", user.id);
    await adminClient.from("traction_milestones").update({ verified_by: null }).eq("verified_by", user.id);

    // Delete user profile (cascades to team_members, reviews, submissions, etc.)
    const { error: dbError } = await adminClient
      .from("users")
      .delete()
      .eq("id", user.id);

    if (dbError) {
      console.error("[Delete Account] DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete account data" },
        { status: 500 }
      );
    }

    // Delete auth user via admin API
    const { error: authError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (authError) {
      return NextResponse.json(
        { error: "Failed to delete auth account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

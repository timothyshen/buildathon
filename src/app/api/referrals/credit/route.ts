import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Update all pending referrals for this user to credited
    const { data: updated, error: updateError } = await adminClient
      .from("referrals")
      .update({
        status: "credited",
        credited_at: new Date().toISOString(),
      })
      .eq("referred_id", user.id)
      .eq("status", "pending")
      .select("id");

    if (updateError) {
      console.error("[Referrals] Credit error:", updateError);
      return NextResponse.json({ credited: false, reason: "internal_error" });
    }

    // Clear the ref_code cookie
    const response = NextResponse.json({
      credited: true,
      count: updated?.length || 0,
    });
    response.cookies.delete("ref_code");

    return response;
  } catch (err) {
    console.error("[Referrals] Credit error:", err);
    return NextResponse.json({ credited: false, reason: "internal_error" });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Verify cron secret or authenticated admin user
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Path 1: Vercel cron with secret
    const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // Path 2: Authenticated admin user
    let isAdmin = false;
    if (!isCronAuth) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        isAdmin = profile?.role === "admin";
      }
    }

    if (!isCronAuth && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch all IP assets
    const { data: ipAssets, error: fetchError } = await admin
      .from("ip_assets")
      .select("id, ip_id");

    if (fetchError || !ipAssets) {
      return NextResponse.json(
        { error: "Failed to fetch IP assets" },
        { status: 500 }
      );
    }

    let synced = 0;

    for (const asset of ipAssets) {
      try {
        // Count derivatives
        const { count } = await admin
          .from("ip_assets")
          .select("id", { count: "exact", head: true })
          .eq("parent_ip_id", asset.ip_id);

        // Check for existing snapshot
        const { data: existing } = await admin
          .from("royalty_snapshots")
          .select("id")
          .eq("ip_asset_id", asset.id)
          .maybeSingle();

        if (existing) {
          // Update existing snapshot
          await admin
            .from("royalty_snapshots")
            .update({
              derivative_count: count || 0,
              snapshot_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Insert new snapshot
          await admin.from("royalty_snapshots").insert({
            ip_asset_id: asset.id,
            total_revenue_wip: "0",
            claimable_wip: "0",
            royalty_token_balance: 100,
            derivative_count: count || 0,
          });
        }

        synced++;
      } catch (err) {
        console.error(`Failed to sync royalties for ${asset.ip_id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      total: ipAssets.length,
    });
  } catch (error) {
    console.error("Royalty sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

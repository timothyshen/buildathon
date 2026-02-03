import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGAMetrics } from "@/lib/google-analytics";

/**
 * POST /api/cron/traction-sync
 * Cron job to sync traction metrics from connected services (GA, etc.)
 *
 * Should be called daily via Vercel Cron or external scheduler
 * Requires CRON_SECRET header for authentication
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Fetch all submissions with GA connected
    const { data: tractionRecords, error: fetchError } = await adminClient
      .from("submission_traction")
      .select("submission_id, ga_property_id, ga_refresh_token")
      .not("ga_property_id", "is", null)
      .not("ga_refresh_token", "is", null);

    if (fetchError) {
      console.error("[Traction Sync] Error fetching traction records:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const results = {
      total: tractionRecords?.length || 0,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each submission with GA connected
    for (const record of tractionRecords || []) {
      // Skip if missing required fields (shouldn't happen due to filters, but TypeScript needs this)
      if (!record.ga_property_id || !record.ga_refresh_token) {
        continue;
      }

      try {
        const metrics = await fetchGAMetrics(
          record.ga_property_id,
          record.ga_refresh_token
        );

        // Check if snapshot for today already exists
        const { data: existingSnapshot } = await adminClient
          .from("traction_snapshots")
          .select("id")
          .eq("submission_id", record.submission_id)
          .eq("snapshot_date", today)
          .maybeSingle();

        if (existingSnapshot) {
          // Update existing snapshot with GA data
          await adminClient
            .from("traction_snapshots")
            .update({
              ga_active_users: metrics.activeUsers,
              ga_total_users: metrics.totalUsers,
              ga_sessions: metrics.sessions,
              ga_pageviews: metrics.pageviews,
              ga_bounce_rate: metrics.bounceRate,
              ga_avg_session_duration: metrics.avgSessionDuration,
              data_source: "both", // Manual + API data
            })
            .eq("id", existingSnapshot.id);
        } else {
          // Create new snapshot with GA data
          await adminClient.from("traction_snapshots").insert({
            submission_id: record.submission_id,
            snapshot_date: today,
            ga_active_users: metrics.activeUsers,
            ga_total_users: metrics.totalUsers,
            ga_sessions: metrics.sessions,
            ga_pageviews: metrics.pageviews,
            ga_bounce_rate: metrics.bounceRate,
            ga_avg_session_duration: metrics.avgSessionDuration,
            data_source: "api",
          });
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `${record.submission_id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        console.error(
          `[Traction Sync] Error syncing GA for ${record.submission_id}:`,
          err
        );
      }
    }

    console.log("[Traction Sync] Completed:", results);

    return NextResponse.json({
      message: "Traction sync completed",
      results,
    });
  } catch (error) {
    console.error("[Traction Sync] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(request: Request) {
  return POST(request);
}

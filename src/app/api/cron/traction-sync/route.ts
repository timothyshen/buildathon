import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchGAMetrics } from "@/lib/google-analytics";
import { fetchContractMetrics } from "@/lib/dune";

interface SyncResults {
  ga: { total: number; success: number; failed: number; errors: string[] };
  dune: { total: number; success: number; failed: number; errors: string[] };
}

/**
 * POST /api/cron/traction-sync
 * Cron job to sync traction metrics from connected services (GA, Dune)
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

    const results: SyncResults = {
      ga: { total: 0, success: 0, failed: 0, errors: [] },
      dune: { total: 0, success: 0, failed: 0, errors: [] },
    };

    // Fetch all traction records
    const { data: tractionRecords, error: fetchError } = await adminClient
      .from("submission_traction")
      .select("submission_id, ga_property_id, ga_refresh_token, testnet_contract_address, mainnet_contract_address");

    if (fetchError) {
      console.error("[Traction Sync] Error fetching traction records:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Process each submission
    for (const record of tractionRecords || []) {
      // Helper to get or create today's snapshot
      const getOrCreateSnapshot = async (): Promise<{ id: string | null; isNew: boolean; dataSource: string }> => {
        const { data: existing } = await adminClient
          .from("traction_snapshots")
          .select("id, data_source")
          .eq("submission_id", record.submission_id)
          .eq("snapshot_date", today)
          .maybeSingle();

        if (existing) {
          return { id: existing.id, isNew: false, dataSource: existing.data_source };
        }

        const { data: created, error: insertError } = await adminClient
          .from("traction_snapshots")
          .insert({
            submission_id: record.submission_id,
            snapshot_date: today,
            data_source: "api",
          })
          .select("id")
          .single();

        if (insertError || !created?.id) {
          console.error(`[Traction Sync] Failed to create snapshot for ${record.submission_id}:`, insertError);
          return { id: null, isNew: true, dataSource: "api" };
        }

        return { id: created.id, isNew: true, dataSource: "api" };
      };

      // Sync Google Analytics
      if (record.ga_property_id && record.ga_refresh_token) {
        results.ga.total++;
        try {
          const metrics = await fetchGAMetrics(
            record.ga_property_id,
            record.ga_refresh_token
          );

          const snapshot = await getOrCreateSnapshot();
          if (snapshot.id) {
            await adminClient
              .from("traction_snapshots")
              .update({
                ga_active_users: metrics.activeUsers,
                ga_total_users: metrics.totalUsers,
                ga_sessions: metrics.sessions,
                ga_pageviews: metrics.pageviews,
                ga_bounce_rate: metrics.bounceRate,
                ga_avg_session_duration: metrics.avgSessionDuration,
                data_source: snapshot.isNew ? "api" : "both",
              })
              .eq("id", snapshot.id);
          }

          results.ga.success++;
        } catch (err) {
          results.ga.failed++;
          results.ga.errors.push(
            `${record.submission_id}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
          console.error(`[Traction Sync] GA error for ${record.submission_id}:`, err);
        }
      }

      // Sync Dune (on-chain metrics)
      // Prefer mainnet, fall back to testnet
      const contractAddress = record.mainnet_contract_address || record.testnet_contract_address;
      if (contractAddress && process.env.DUNE_API_KEY) {
        results.dune.total++;
        try {
          const metrics = await fetchContractMetrics(contractAddress);

          const snapshot = await getOrCreateSnapshot();
          if (snapshot.id) {
            await adminClient
              .from("traction_snapshots")
              .update({
                onchain_tx_count: metrics.totalTxCount,
                onchain_unique_addresses: metrics.totalUniqueAddresses,
                onchain_daily_tx_count: metrics.dailyTxCount,
                onchain_weekly_tx_count: metrics.weeklyTxCount,
                onchain_daily_volume: metrics.dailyVolume,
                onchain_weekly_volume: metrics.weeklyVolume,
                onchain_daily_active_addresses: metrics.dailyActiveAddresses,
                onchain_weekly_active_addresses: metrics.weeklyActiveAddresses,
                data_source: snapshot.isNew ? "api" : "both",
              })
              .eq("id", snapshot.id);
          }

          results.dune.success++;
        } catch (err) {
          results.dune.failed++;
          results.dune.errors.push(
            `${record.submission_id}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
          console.error(`[Traction Sync] Dune error for ${record.submission_id}:`, err);
        }
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

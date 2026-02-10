import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBulk } from "@/lib/notify";

/**
 * POST /api/cron/deadline-reminders
 * Sends reminders for upcoming deadlines (24h and 2h before)
 * Should be called hourly via Vercel Cron or external scheduler
 * Requires CRON_SECRET header for authentication
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    let sent = 0;

    // Find cohorts with submission deadlines in the next 23-24h window (for hourly cron)
    const { data: cohorts24h } = await admin
      .from("cohorts")
      .select("id, name, submission_deadline")
      .gte("submission_deadline", in23h.toISOString())
      .lte("submission_deadline", in24h.toISOString())
      .in("status", ["active"]);

    // Find cohorts with submission deadlines in the next 1-2h window
    const { data: cohorts2h } = await admin
      .from("cohorts")
      .select("id, name, submission_deadline")
      .gte("submission_deadline", in1h.toISOString())
      .lte("submission_deadline", in2h.toISOString())
      .in("status", ["active"]);

    // Send 24h reminders
    if (cohorts24h && cohorts24h.length > 0) {
      for (const cohort of cohorts24h) {
        // Get all participants with submissions in draft status
        const { data: drafts } = await admin
          .from("submissions")
          .select("created_by")
          .eq("cohort_id", cohort.id)
          .eq("status", "draft");

        if (drafts && drafts.length > 0) {
          const userIds = [...new Set(drafts.map((d) => d.created_by))];
          await notifyBulk(
            userIds.map((userId) => ({
              userId,
              type: "deadline_reminder" as const,
              title: "Submission deadline in 24 hours",
              body: `"${cohort.name}" submission deadline is tomorrow. Don't forget to submit!`,
              href: `/submissions`,
              metadata: { cohortId: cohort.id },
            }))
          );
          sent += userIds.length;
        }
      }
    }

    // Send 2h reminders
    if (cohorts2h && cohorts2h.length > 0) {
      for (const cohort of cohorts2h) {
        const { data: drafts } = await admin
          .from("submissions")
          .select("created_by")
          .eq("cohort_id", cohort.id)
          .eq("status", "draft");

        if (drafts && drafts.length > 0) {
          const userIds = [...new Set(drafts.map((d) => d.created_by))];
          await notifyBulk(
            userIds.map((userId) => ({
              userId,
              type: "deadline_reminder" as const,
              title: "Submission deadline in 2 hours!",
              body: `"${cohort.name}" deadline is in 2 hours. Submit now!`,
              href: `/submissions`,
              metadata: { cohortId: cohort.id, urgent: true },
            }))
          );
          sent += userIds.length;
        }
      }
    }

    // Judge review deadline reminders
    const { data: judgingCohorts } = await admin
      .from("cohorts")
      .select("id, name, judging_end")
      .not("judging_end", "is", null)
      .gte("judging_end", in23h.toISOString())
      .lte("judging_end", in24h.toISOString())
      .in("status", ["judging"]);

    if (judgingCohorts && judgingCohorts.length > 0) {
      for (const cohort of judgingCohorts) {
        // Find judges with pending reviews
        const { data: pendingReviews } = await admin
          .from("reviews")
          .select("judge_id, submissions!inner(cohort_id)")
          .eq("submissions.cohort_id", cohort.id)
          .in("status", ["pending", "in_progress"]);

        if (pendingReviews && pendingReviews.length > 0) {
          const judgeIds = [...new Set(pendingReviews.map((r) => r.judge_id))];
          await notifyBulk(
            judgeIds.map((judgeId) => ({
              userId: judgeId,
              type: "review_deadline" as const,
              title: "Review deadline in 24 hours",
              body: `"${cohort.name}" judging ends tomorrow. Complete your reviews!`,
              href: `/reviews`,
              metadata: { cohortId: cohort.id },
            }))
          );
          sent += judgeIds.length;
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("Deadline reminders error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

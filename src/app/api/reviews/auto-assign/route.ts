import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Verify admin auth
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
    const { cohortId } = body;

    if (!cohortId) {
      return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch cohort config
    const { data: cohort } = await admin
      .from("cohorts")
      .select("id, min_reviews_per_submission")
      .eq("id", cohortId)
      .single();

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    const minReviews = cohort.min_reviews_per_submission ?? 3;

    // 2. Fetch judges assigned to this cohort
    const { data: cohortJudges } = await admin
      .from("cohort_judges")
      .select("judge_id")
      .eq("cohort_id", cohortId);

    const judgeIds = (cohortJudges || []).map((cj) => cj.judge_id);

    if (judgeIds.length === 0) {
      return NextResponse.json({
        error: "No judges assigned to this cohort. Add judges first.",
      }, { status: 400 });
    }

    // 3. Fetch submitted submissions for this cohort
    const { data: submissions } = await admin
      .from("submissions")
      .select("id, team_id, created_by")
      .eq("cohort_id", cohortId)
      .in("status", ["submitted", "under_review"]);

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: 0,
        summary: { submissions: 0, judges: judgeIds.length, reviewsPerSubmission: minReviews },
      });
    }

    // 4. Fetch existing reviews for these submissions
    const submissionIds = submissions.map((s) => s.id);
    const { data: existingReviews } = await admin
      .from("reviews")
      .select("submission_id, judge_id")
      .in("submission_id", submissionIds);

    // Build set of existing assignments: "submissionId:judgeId"
    const existingSet = new Set(
      (existingReviews || []).map((r) => `${r.submission_id}:${r.judge_id}`)
    );

    // Count existing reviews per submission
    const reviewCounts = new Map<string, number>();
    for (const r of existingReviews || []) {
      reviewCounts.set(r.submission_id, (reviewCounts.get(r.submission_id) || 0) + 1);
    }

    // 5. Build conflict map: judge → set of submission IDs they can't review
    const { data: teamMembers } = await admin
      .from("team_members")
      .select("team_id, user_id")
      .in("user_id", judgeIds);

    const judgeTeams = new Map<string, Set<string>>();
    for (const tm of teamMembers || []) {
      if (!judgeTeams.has(tm.user_id)) judgeTeams.set(tm.user_id, new Set());
      judgeTeams.get(tm.user_id)!.add(tm.team_id);
    }

    const conflicts = new Map<string, Set<string>>();
    for (const judgeId of judgeIds) {
      const conflictSubs = new Set<string>();
      for (const sub of submissions) {
        // Can't review own submission
        if (sub.created_by === judgeId) {
          conflictSubs.add(sub.id);
          continue;
        }
        // Can't review team's submission
        if (sub.team_id && judgeTeams.get(judgeId)?.has(sub.team_id)) {
          conflictSubs.add(sub.id);
        }
      }
      conflicts.set(judgeId, conflictSubs);
    }

    // 6. Track assignment counts for load balancing
    const assignmentCounts = new Map<string, number>();
    for (const judgeId of judgeIds) {
      const count = (existingReviews || []).filter((r) => r.judge_id === judgeId).length;
      assignmentCounts.set(judgeId, count);
    }

    // 7. Round-robin assignment
    const newReviews: { submission_id: string; judge_id: string; status: "pending" }[] = [];
    let skipped = 0;

    for (const sub of submissions) {
      const currentCount = reviewCounts.get(sub.id) || 0;
      const needed = minReviews - currentCount;

      if (needed <= 0) continue;

      // Sort judges by assignment count (ascending) for even distribution
      const sortedJudges = [...judgeIds].sort(
        (a, b) => (assignmentCounts.get(a) || 0) - (assignmentCounts.get(b) || 0)
      );

      let assigned = 0;
      for (const judgeId of sortedJudges) {
        if (assigned >= needed) break;

        // Skip if already assigned
        if (existingSet.has(`${sub.id}:${judgeId}`)) continue;

        // Skip if conflict of interest
        if (conflicts.get(judgeId)?.has(sub.id)) {
          skipped++;
          continue;
        }

        newReviews.push({
          submission_id: sub.id,
          judge_id: judgeId,
          status: "pending",
        });

        // Track the new assignment
        existingSet.add(`${sub.id}:${judgeId}`);
        assignmentCounts.set(judgeId, (assignmentCounts.get(judgeId) || 0) + 1);
        assigned++;
      }
    }

    // 8. Bulk insert new reviews
    let created = 0;
    if (newReviews.length > 0) {
      const { error: insertError } = await admin
        .from("reviews")
        .insert(newReviews);

      if (insertError) {
        console.error("[Auto-Assign] Insert error:", insertError);
        return NextResponse.json({ error: "Failed to create reviews" }, { status: 500 });
      }
      created = newReviews.length;
    }

    return NextResponse.json({
      created,
      skipped,
      summary: {
        submissions: submissions.length,
        judges: judgeIds.length,
        reviewsPerSubmission: minReviews,
      },
    });
  } catch (err) {
    console.error("[Auto-Assign] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

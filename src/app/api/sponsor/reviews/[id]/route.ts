import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - fetch a review by ID for sponsors
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify user is sponsor or admin
    const { data: userData } = await adminClient
      .from("users")
      .select("role, sponsor_org_id")
      .eq("id", user.id)
      .single();

    if (!userData || (userData.role !== "sponsor" && userData.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: review, error: dbError } = await adminClient
      .from("reviews")
      .select(`
        *,
        users!reviews_judge_id_fkey (*),
        submissions (
          *,
          teams (*),
          cohorts (*)
        )
      `)
      .eq("id", id)
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 404 });
    }

    // Verify sponsor owns a track this submission belongs to
    if (userData.role === "sponsor" && userData.sponsor_org_id) {
      const submissionId = review.submission_id;
      const { data: tracks } = await adminClient
        .from("tracks")
        .select("id")
        .eq("sponsor_org_id", userData.sponsor_org_id);

      const trackIds = (tracks || []).map((t) => t.id);

      const { data: submissionTracks } = await adminClient
        .from("submission_tracks")
        .select("track_id")
        .eq("submission_id", submissionId);

      const hasAccess = (submissionTracks || []).some((st) =>
        trackIds.includes(st.track_id)
      );

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: review });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - submit/update review scores for sponsors
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify user is sponsor or admin
    const { data: userData } = await adminClient
      .from("users")
      .select("role, sponsor_org_id")
      .eq("id", user.id)
      .single();

    if (!userData || (userData.role !== "sponsor" && userData.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify review exists and belongs to this user
    const { data: reviewRow } = await adminClient
      .from("reviews")
      .select("submission_id, judge_id, status")
      .eq("id", id)
      .single();

    if (!reviewRow) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (reviewRow.judge_id !== user.id) {
      return NextResponse.json(
        { error: "Can only submit your own reviews" },
        { status: 403 }
      );
    }

    if (reviewRow.status === "completed") {
      return NextResponse.json(
        { error: "Review already completed" },
        { status: 400 }
      );
    }

    // Verify sponsor track ownership
    if (userData.role === "sponsor" && userData.sponsor_org_id) {
      const { data: tracks } = await adminClient
        .from("tracks")
        .select("id")
        .eq("sponsor_org_id", userData.sponsor_org_id);

      const trackIds = (tracks || []).map((t) => t.id);

      const { data: submissionTracks } = await adminClient
        .from("submission_tracks")
        .select("track_id")
        .eq("submission_id", reviewRow.submission_id);

      const hasAccess = (submissionTracks || []).some((st) =>
        trackIds.includes(st.track_id)
      );

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      innovationScore,
      executionScore,
      designScore,
      impactScore,
      presentationScore,
      feedback,
      internalNotes,
    } = body;

    // Validate scores
    const scores = [innovationScore, executionScore, designScore, impactScore, presentationScore];
    if (scores.some((s: number) => typeof s !== "number" || s < 1 || s > 10)) {
      return NextResponse.json(
        { error: "All scores must be between 1 and 10" },
        { status: 400 }
      );
    }

    const overallScore =
      (innovationScore + executionScore + designScore + impactScore + presentationScore) / 5;

    const { data: updated, error: updateError } = await adminClient
      .from("reviews")
      .update({
        innovation_score: innovationScore,
        execution_score: executionScore,
        design_score: designScore,
        impact_score: impactScore,
        presentation_score: presentationScore,
        overall_score: overallScore,
        feedback: feedback || null,
        internal_notes: internalNotes || null,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

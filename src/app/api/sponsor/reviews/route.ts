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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: "Missing submissionId" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify user is a sponsor
    const { data: userData } = await adminClient
      .from("users")
      .select("role, sponsor_org_id")
      .eq("id", user.id)
      .single();

    if (!userData || (userData.role !== "sponsor" && userData.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the submission belongs to one of the sponsor's tracks
    if (userData.role === "sponsor" && userData.sponsor_org_id) {
      const { data: tracks } = await adminClient
        .from("tracks")
        .select("id")
        .eq("sponsor_org_id", userData.sponsor_org_id);

      const trackIds = (tracks || []).map((t) => t.id);

      // Check via junction table
      const { data: submissionTracks } = await adminClient
        .from("submission_tracks")
        .select("track_id")
        .eq("submission_id", submissionId);

      const hasMatchingTrack = (submissionTracks || []).some((st) =>
        trackIds.includes(st.track_id)
      );

      if (!hasMatchingTrack) {
        return NextResponse.json(
          { error: "Submission is not in your tracks" },
          { status: 403 }
        );
      }
    }

    // Create review via admin client
    const { data: created, error: dbError } = await adminClient
      .from("reviews")
      .insert({
        submission_id: submissionId,
        judge_id: user.id,
        status: "pending",
      })
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: created });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

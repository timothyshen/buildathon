import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addGuestToEvent } from "@/lib/luma/events";

export async function POST(request: Request) {
  try {
    const { eventApiId } = await request.json();

    if (!eventApiId) {
      return NextResponse.json(
        { error: "eventApiId is required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Track RSVP locally first
    const adminClient = createAdminClient();
    const { error: dbError } = await adminClient.from("event_rsvps").upsert(
      {
        luma_event_id: eventApiId,
        user_id: user.id,
      },
      { onConflict: "luma_event_id,user_id" }
    );

    if (dbError) {
      console.error("[RSVP] Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save RSVP" },
        { status: 500 }
      );
    }

    // 2. Then register on Luma (non-critical — log but don't fail)
    try {
      await addGuestToEvent(eventApiId, user.email, user.user_metadata?.name);
    } catch (lumaError) {
      console.error("[RSVP] Luma registration failed (RSVP saved locally):", lumaError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RSVP] Error:", err);
    return NextResponse.json(
      { error: "Failed to RSVP" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get user's RSVPs for displaying RSVP status
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ rsvps: [] });
    }

    const adminClient = createAdminClient();
    const { data: rsvps, error } = await adminClient
      .from("event_rsvps")
      .select("luma_event_id, created_at")
      .eq("user_id", user.id);

    if (error) {
      console.error("[RSVP GET] Database error:", error);
      return NextResponse.json({ rsvps: [] });
    }

    return NextResponse.json({
      rsvps: (rsvps || []).map((r) => r.luma_event_id),
    });
  } catch (err) {
    console.error("[RSVP GET] Error:", err);
    return NextResponse.json({ rsvps: [] });
  }
}

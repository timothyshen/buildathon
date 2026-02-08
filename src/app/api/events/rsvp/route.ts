import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Register guest on Luma
    await addGuestToEvent(eventApiId, user.email, user.user_metadata?.name);

    // Track RSVP locally for fast lookups
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RSVP] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to RSVP" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get user's RSVPs for displaying RSVP status
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

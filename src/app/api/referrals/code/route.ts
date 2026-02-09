import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(request: Request) {
  try {
    const { cohortId } = await request.json();

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!cohortId || !UUID_REGEX.test(cohortId)) {
      return NextResponse.json({ error: "Valid cohortId is required" }, { status: 400 });
    }

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

    const adminClient = createAdminClient();

    // Verify user is a participant
    const { data: profile } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "participant") {
      return NextResponse.json({ error: "Only participants can generate referral codes" }, { status: 403 });
    }

    // Check for existing code
    const { data: existing } = await adminClient
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .eq("cohort_id", cohortId)
      .single();

    if (existing) {
      return NextResponse.json({ code: existing.code });
    }

    // Generate new code with collision retry
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateShortCode();
      const { data: created, error: insertError } = await adminClient
        .from("referral_codes")
        .insert({ user_id: user.id, cohort_id: cohortId, code })
        .select("code")
        .single();

      if (created) {
        return NextResponse.json({ code: created.code });
      }

      if (insertError?.code === "23505") {
        // Check if race condition on user+cohort
        const { data: raceResult } = await adminClient
          .from("referral_codes")
          .select("code")
          .eq("user_id", user.id)
          .eq("cohort_id", cohortId)
          .single();

        if (raceResult) {
          return NextResponse.json({ code: raceResult.code });
        }
        continue; // Code collision, retry
      }

      console.error("[Referrals] Failed to create code:", insertError);
      return NextResponse.json({ error: "Failed to create referral code" }, { status: 500 });
    }

    return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
  } catch (err) {
    console.error("[Referrals] Code generation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

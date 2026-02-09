import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refCode = cookieStore.get("ref_code")?.value;

    if (!refCode) {
      return NextResponse.json({ recorded: false, reason: "no_ref_code" });
    }

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
      return NextResponse.json({ recorded: false, reason: "not_authenticated" });
    }

    const adminClient = createAdminClient();

    // Look up the referral code
    const { data: codeRecord } = await adminClient
      .from("referral_codes")
      .select("id, user_id, cohort_id")
      .eq("code", refCode)
      .single();

    if (!codeRecord) {
      return NextResponse.json({ recorded: false, reason: "invalid_code" });
    }

    // Prevent self-referral
    if (codeRecord.user_id === user.id) {
      return NextResponse.json({ recorded: false, reason: "self_referral" });
    }

    // Insert pending referral (UNIQUE constraint prevents duplicates)
    const { error: insertError } = await adminClient
      .from("referrals")
      .insert({
        referral_code_id: codeRecord.id,
        referrer_id: codeRecord.user_id,
        referred_id: user.id,
        cohort_id: codeRecord.cohort_id,
        status: "pending",
      });

    if (insertError?.code === "23505") {
      return NextResponse.json({ recorded: false, reason: "already_referred" });
    }

    if (insertError) {
      console.error("[Referrals] Record error:", insertError);
      return NextResponse.json({ recorded: false, reason: "internal_error" });
    }

    return NextResponse.json({ recorded: true });
  } catch (err) {
    console.error("[Referrals] Record error:", err);
    return NextResponse.json({ recorded: false, reason: "internal_error" });
  }
}

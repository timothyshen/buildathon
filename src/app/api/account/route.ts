import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  try {
    // Verify user is authenticated
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

    // Delete user profile from database first
    const { error: dbError } = await adminClient
      .from("users")
      .delete()
      .eq("id", user.id);

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to delete account data" },
        { status: 500 }
      );
    }

    // Delete auth user via admin API
    const { error: authError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (authError) {
      return NextResponse.json(
        { error: "Failed to delete auth account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

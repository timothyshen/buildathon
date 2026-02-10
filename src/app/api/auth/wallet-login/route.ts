import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Wallet address is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find user by wallet address (case-insensitive for EVM addresses)
    const { data: user, error: dbError } = await supabase
      .from("users")
      .select("id, email")
      .ilike("wallet_address", walletAddress)
      .maybeSingle();

    if (dbError) {
      console.error("Wallet login DB error:", dbError);
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Internal server error" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "NO_ACCOUNT", message: "No account found with this wallet address" },
        { status: 404 }
      );
    }

    // Generate a magic link for the user's email
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Magic link generation error:", linkError);
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Failed to generate login link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email: user.email,
      token_hash: linkData.properties.hashed_token,
    });
  } catch (error) {
    console.error("Wallet login error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

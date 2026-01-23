import { NextResponse } from "next/server";

// For now, we'll store in memory. Replace with Supabase when configured.
const waitlist: Array<{
  email: string;
  interests: string[];
  createdAt: Date;
}> = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, interests = [] } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if already on waitlist (in-memory check)
    const existing = waitlist.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }

    // Add to waitlist
    waitlist.push({
      email: email.toLowerCase(),
      interests: Array.isArray(interests) ? interests : [],
      createdAt: new Date(),
    });

    console.log(`[Waitlist] New signup: ${email}`, { interests });

    return NextResponse.json(
      { message: "Successfully joined the waitlist" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Waitlist] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple endpoint to check waitlist count (for admin use)
  return NextResponse.json({
    count: waitlist.length,
  });
}

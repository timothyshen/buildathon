import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (interests && !Array.isArray(interests)) {
      return NextResponse.json({ error: "Interests must be an array" }, { status: 400 });
    }
    const validInterests = Array.isArray(interests)
      ? interests.filter((i: unknown): i is string => typeof i === 'string' && i.length < 200).slice(0, 50)
      : [];

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
      interests: validInterests,
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
  // Only allow authenticated users to check waitlist count
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

  return NextResponse.json({
    count: waitlist.length,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identity = typeof body?.identity === "string" ? body.identity.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!identity) {
      return NextResponse.json(
        { error: "Enter your username or email address." },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Enter your account password." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let loginEmail = identity;

    if (!identity.includes("@")) {
      const adminClient = createAdminClient();
      const lookupClient = adminClient || supabase;

      const { data: profile, error: profileError } = await lookupClient
        .from("profiles")
        .select("email")
        .eq("username", identity)
        .maybeSingle();

      if (profileError || !profile?.email) {
        return NextResponse.json(
          { error: "Invalid username/email or password." },
          { status: 401 }
        );
      }

      loginEmail = profile.email;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message || "Invalid username/email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: authData.session,
    });
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}

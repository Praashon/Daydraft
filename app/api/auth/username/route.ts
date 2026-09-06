import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim().toLowerCase();
  if (!username || !/^[a-z0-9._]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("username", username)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Username lookup is unavailable" }, { status: 503 });
  if (!data) return NextResponse.json({ available: true });
  return NextResponse.json({ available: false, email: data.email });
}

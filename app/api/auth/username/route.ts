import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomInt } from "crypto";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim().toLowerCase();
  if (!username || !/^[a-z0-9._]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Username lookup is unavailable" }, { status: 503 });
  if (!data) return NextResponse.json({ available: true });

  const clean = username.replace(/[^a-z0-9_]/g, "") || "user";
  const year = new Date().getFullYear();
  const suffix1 = randomInt(10, 100);
  let suffix2 = randomInt(10, 100);
  if (suffix2 === suffix1) {
    suffix2 = ((suffix1 + 7) % 90) + 10;
  }

  const suggestions = [
    `${clean}${suffix1}`,
    `${clean}_${suffix2}`,
    `${clean}${year}`,
  ].filter((s) => s.length >= 3 && s.length <= 24);

  return NextResponse.json({
    available: false,
    suggestions,
  });
}

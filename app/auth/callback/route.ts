import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id, name, username")
      .eq("id", user.id)
      .maybeSingle();

    const metaName = (user.user_metadata?.name as string) || "";
    const metaUsername =
      (user.user_metadata?.username as string) ||
      (user.email
        ? user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9._]/g, "")
        : "user");

    if (!existing) {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          username: metaUsername,
          name: metaName,
          email: user.email || "",
          avatar_url: (user.user_metadata?.avatar_url as string) || "",
        },
        { onConflict: "id" }
      );
    } else if (
      (!existing.name && metaName) ||
      (!existing.username && metaUsername)
    ) {
      const updates: Record<string, string> = {};
      if (!existing.name && metaName) updates.name = metaName;
      if (!existing.username && metaUsername) updates.username = metaUsername;
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", user.id);
      }
    }
  } catch (e) {
    console.error("Failed to ensure profile in callback:", e);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      await ensureProfile(supabase);
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureProfile(supabase);
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent(
        "Confirmation link is invalid or has expired. Please request a new one."
      )}`,
      request.url
    )
  );
}


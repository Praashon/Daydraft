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
      .select("id, name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const metaName =
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      "";
    const metaAvatar =
      (user.user_metadata?.avatar_url as string) ||
      (user.user_metadata?.picture as string) ||
      "";
    const metaUsername =
      (user.user_metadata?.username as string) ||
      (user.email
        ? user.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9._]/g, "")
        : "user");

    if (!existing) {
      let candidateUsername = metaUsername;
      const { data: usernameTaken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", candidateUsername)
        .maybeSingle();

      if (usernameTaken && usernameTaken.id !== user.id) {
        candidateUsername = `${candidateUsername.slice(0, 18)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          username: candidateUsername,
          name: metaName,
          email: user.email || "",
          avatar_url: metaAvatar,
        },
        { onConflict: "id" }
      );
    } else if (
      (!existing.name && metaName) ||
      (!existing.username && metaUsername) ||
      (!existing.avatar_url && metaAvatar)
    ) {
      const updates: Record<string, string> = {};
      if (!existing.name && metaName) updates.name = metaName;
      if (!existing.username && metaUsername) updates.username = metaUsername;
      if (!existing.avatar_url && metaAvatar) updates.avatar_url = metaAvatar;
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
  const authError =
    searchParams.get("error_description") || searchParams.get("error");
  if (authError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(authError)}`, request.url)
    );
  }

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = data?.user || (await supabase.auth.getUser()).data.user;
      if (user) {
        const providers = user.app_metadata?.providers || [];
        const hasEmailProvider = providers.includes("email");
        const isProfileComplete = hasEmailProvider || Boolean(
          user.user_metadata?.profile_completed &&
            user.user_metadata?.has_password
        );
        if (!isProfileComplete) {
          return NextResponse.redirect(new URL("/auth/setup", request.url));
        }
      }
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


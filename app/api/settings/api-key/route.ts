import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptApiKey } from "@/lib/vault";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, apiKey } = await req.json();

    if (!provider || !["gemini", "openrouter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const encryptedKey = encryptApiKey(apiKey, user.id);
    const keyLast4 = apiKey.slice(-4);

    const admin = createAdminClient();
    const db = admin || supabase;
    const { error } = await db.from("user_api_keys").upsert({
      user_id: user.id,
      provider,
      encrypted_key: encryptedKey,
      key_last4: keyLast4,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });

    if (error) {
      console.error("DB error saving API key:", error);
      return NextResponse.json({ error: error.message || "Failed to save API key" }, { status: 500 });
    }

    return NextResponse.json({ success: true, last4: keyLast4 });
  } catch (err: unknown) {
    console.error("API key error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider || !["gemini", "openrouter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const admin = createAdminClient();
    const db = admin || supabase;
    const { error } = await db.from("user_api_keys").delete().eq("user_id", user.id).eq("provider", provider);

    if (error) {
      console.error("DB error deleting API key:", error);
      return NextResponse.json({ error: error.message || "Failed to delete API key" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("API key delete error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider || !["gemini", "openrouter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const admin = createAdminClient();
    const db = admin || supabase;
    const { data, error } = await db.from("user_api_keys").select("key_last4").eq("user_id", user.id).eq("provider", provider).maybeSingle();

    if (error) {
      console.error("DB error fetching API key metadata:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch key metadata" }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ hasKey: true, last4: data.key_last4 });
    }

    return NextResponse.json({ hasKey: false });
  } catch (err: unknown) {
    console.error("API key get error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

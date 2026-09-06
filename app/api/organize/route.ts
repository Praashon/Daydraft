import { NextRequest, NextResponse } from "next/server";
import { organizeThoughts } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/vault";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { text, provider, model } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Brain dump text is required" },
        { status: 400 }
      );
    }
    
    let apiKey;
    
    if (user && provider) {
      const admin = createAdminClient();
      const db = admin || supabase;
      const { data } = await db.from("user_api_keys").select("encrypted_key").eq("user_id", user.id).eq("provider", provider).maybeSingle();
      if (data?.encrypted_key) {
        apiKey = decryptApiKey(data.encrypted_key, user.id);
      }
    }

    const organized = await organizeThoughts(text.trim(), {
      provider,
      apiKey,
      model,
    });

    return NextResponse.json(organized, { status: 200 });
  } catch (error) {
    console.error("API Error in /api/organize:", error);
    return NextResponse.json(
      { error: "Failed to process brain dump. Please try again." },
      { status: 500 }
    );
  }
}

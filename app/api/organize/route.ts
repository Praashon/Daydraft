import { NextRequest, NextResponse } from "next/server";
import { organizeThoughts } from "@/lib/ai";
import { OrganizeError } from "@/lib/organize-response";
import { RequestTimeoutError, withDeadline } from "@/lib/request-deadline";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/vault";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    return await withDeadline(async (signal) => {
      const body = await req.json().catch(() => null);
      if (!body || typeof body.text !== "string" || !body.text.trim()) {
        throw new OrganizeError("Brain dump text is required.", 400, "INVALID_INPUT");
      }
      const { text, model } = body;
      const provider = body.provider ?? "openrouter";
      if (!["openrouter", "gemini"].includes(provider) || (model !== undefined && typeof model !== "string")) {
        throw new OrganizeError("Choose a valid AI provider and model in Settings.", 400, "INVALID_INPUT");
      }
      const supabase = await createClient(signal);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new OrganizeError("Your session has expired. Sign in again to organize your thoughts.", 401, "SIGN_IN_REQUIRED");
      }
      const db = createAdminClient() || supabase;
      const { data, error } = await db.from("user_api_keys")
        .select("encrypted_key").eq("user_id", user.id).eq("provider", provider)
        .abortSignal(signal).maybeSingle();
      if (error) {
        throw new OrganizeError("Could not load your AI settings. Please try again.", 503, "SETTINGS_UNAVAILABLE");
      }
      let apiKey;
      if (data?.encrypted_key) {
        try {
          apiKey = decryptApiKey(data.encrypted_key, user.id);
        } catch {
          throw new OrganizeError("Your saved API key could not be opened. Save it again in Settings.", 503, "KEY_UNAVAILABLE");
        }
      }
      const organized = await organizeThoughts(text.trim(), { provider, apiKey, model, signal });
      return NextResponse.json(organized);
    }, 35_000, req.signal);
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      return NextResponse.json({ error: "Organizing took too long. Please retry or choose another model in Settings.", code: "TIMEOUT" }, { status: 504 });
    }
    if (error instanceof OrganizeError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (req.signal.aborted) {
      return NextResponse.json({ error: "Request cancelled.", code: "CANCELLED" }, { status: 499 });
    }
    console.error("Unexpected failure in /api/organize");
    return NextResponse.json({ error: "Could not organize your thoughts. Please try again.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

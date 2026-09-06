import { NextRequest, NextResponse } from "next/server";
import { rebalancePlan } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/vault";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { tasks, dailyPlan, provider, model } = body;

    let apiKey;

    if (user && provider) {
      const admin = createAdminClient();
      const db = admin || supabase;
      const { data } = await db
        .from("user_api_keys")
        .select("encrypted_key")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .maybeSingle();
      if (data?.encrypted_key) {
        apiKey = decryptApiKey(data.encrypted_key, user.id);
      }
    }

    const rebalanced = await rebalancePlan({
      tasks: Array.isArray(tasks) ? tasks : [],
      dailyPlan: Array.isArray(dailyPlan) ? dailyPlan : [],
      provider,
      apiKey,
      model,
    });

    return NextResponse.json(rebalanced, { status: 200 });
  } catch (error) {
    console.error("API Error in /api/organize/auto-update:", error);
    return NextResponse.json(
      { error: "Failed to auto-update tasks and schedule" },
      { status: 500 }
    );
  }
}

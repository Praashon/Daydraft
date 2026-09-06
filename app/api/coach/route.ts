import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/vault";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are an intelligent AI coach and tutor integrated into a productivity app. 
The user is currently focused on a specific task.
Your goal is to guide them, offer strategies, and break down the topic for them.
You should ask questions when you need clarification on what exactly they want to learn or achieve.
Provide actionable advice, tips, and step-by-step guidance.
Keep your responses relatively brief (1-3 paragraphs) since it's a chat interface.
Always be supportive and constructive.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { taskTitle, message, history, provider, model } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    
    let userApiKey;
    if (user && provider) {
      const admin = createAdminClient();
      const db = admin || supabase;
      const { data } = await db.from("user_api_keys").select("encrypted_key").eq("user_id", user.id).eq("provider", provider).maybeSingle();
      if (data?.encrypted_key) {
        userApiKey = decryptApiKey(data.encrypted_key, user.id);
      }
    }

    if (provider === "gemini") {
      const activeKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) throw new Error("No Gemini API Key found");

      const client = new GoogleGenAI({ apiKey: activeKey });
      
      const contents = history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: `${SYSTEM_PROMPT}\n\nThe user's task context is: "${taskTitle}"`
        }
      });

      return NextResponse.json({ reply: response.text });
    } else {
      const activeKey = userApiKey || process.env.OPENROUTER_API_KEY;
      if (!activeKey) throw new Error("No OpenRouter API Key found");

      const openRouterMessages = [
        { role: "system", content: `${SYSTEM_PROMPT}\n\nThe user's task context is: "${taskTitle}"` },
        ...history,
        { role: "user", content: message }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://daydraft.net",
          "X-Title": "Daydraft",
        },
        body: JSON.stringify({
          model: model || "openrouter/free",
          messages: openRouterMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from OpenRouter");
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || "";
      const cleanedContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      return NextResponse.json({ reply: cleanedContent });
    }
  } catch (error) {
    console.error("Coach API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate coaching response" },
      { status: 500 }
    );
  }
}

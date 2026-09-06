import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is required" }, { status: 400 });
    }

    if (provider === "gemini") {
      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hi",
        config: { maxOutputTokens: 5 }
      });
      if (response.text) {
        return NextResponse.json({ success: true });
      }
      throw new Error("Invalid response from Gemini");
    } else if (provider === "openrouter") {
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ success: true, data });
      }
      throw new Error("Invalid OpenRouter API key");
    }

    return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

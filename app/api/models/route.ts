import { NextResponse } from "next/server";
import { OpenRouterModel } from "@/types";

const FALLBACK_FREE_MODELS: OpenRouterModel[] = [
  {
    id: "openrouter/free",
    name: "OpenRouter: Free Auto-Router",
    description: "Automatically routes prompts to currently available and fastest free models.",
    context_length: 200000,
    isFree: true,
    provider: "openrouter",
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Google: Gemma 4 31B (Free)",
    description: "High-capability instruction-tuned open weights model by Google DeepMind.",
    context_length: 262144,
    isFree: true,
    provider: "google",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Google: Gemma 4 26B A4B (Free)",
    description: "Efficient mixture-of-experts model optimized for reasoning and tasks.",
    context_length: 262144,
    isFree: true,
    provider: "google",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "NVIDIA: Nemotron 3 Super 120B (Free)",
    description: "Powerful frontier-class open architecture model by NVIDIA.",
    context_length: 262144,
    isFree: true,
    provider: "nvidia",
  },
  {
    id: "minimax/minimax-m3:free",
    name: "MiniMax: MiniMax M3 (Free)",
    description: "High-capacity multimodal and long-context processing engine.",
    context_length: 1048576,
    isFree: true,
    provider: "minimax",
  },
  {
    id: "liquid/lfm-2.5-2.6b:free",
    name: "LiquidAI: LFM 2.5 2.6B (Free)",
    description: "Ultra-fast lightweight liquid state model for quick structuring.",
    context_length: 65536,
    isFree: true,
    provider: "liquid",
  },
  {
    id: "cohere/north-mini-code:free",
    name: "Cohere: North Mini Code (Free)",
    description: "Optimized for structured logic, code synthesis, and task breakdown.",
    context_length: 256000,
    isFree: true,
    provider: "cohere",
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "1";

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "HTTP-Referer": "https://daydraft.net",
        "X-Title": "Daydraft",
      },
      ...(forceRefresh ? { cache: "no-store" } : { next: { revalidate: 300 } }),
    });

    if (!res.ok) {
      console.warn("OpenRouter models API returned non-200 status, using fallback free models.");
      return NextResponse.json({ models: FALLBACK_FREE_MODELS, source: "fallback" });
    }

    const data = await res.json();
    const rawModels: any[] = data.data || [];

    const freeModels: OpenRouterModel[] = rawModels
      .filter((m) => {
        const promptCost = parseFloat(m.pricing?.prompt || "0");
        const completionCost = parseFloat(m.pricing?.completion || "0");
        const requestCost = parseFloat(m.pricing?.request || "0");
        const isFreePrice = promptCost === 0 && completionCost === 0 && requestCost === 0;
        const isFreeId = m.id.endsWith(":free") || m.id === "openrouter/free";

        if (!isFreePrice && !isFreeId) return false;

        if (m.id.includes("lyria") || m.id.includes("content-safety")) return false;

        if (m.architecture) {
          const outMods = m.architecture.output_modalities || [];
          if (outMods.length > 0 && !outMods.includes("text")) return false;
          if (m.architecture.modality && m.architecture.modality.includes("audio") && !m.architecture.modality.includes("text")) {
            return false;
          }
        }

        return true;
      })
      .map((m) => {
        const provider = m.id.split("/")[0] || "other";
        let formattedName = m.name || m.id;
        if (!formattedName.toLowerCase().includes("free")) {
          formattedName = `${formattedName} (Free)`;
        }

        return {
          id: m.id,
          name: formattedName,
          description: m.description ? m.description.slice(0, 160) + "..." : "Free model on OpenRouter",
          context_length: m.context_length || 32000,
          isFree: true,
          provider,
        };
      });

    const hasAutoFree = freeModels.some((m) => m.id === "openrouter/free");
    const sorted = [...freeModels];
    if (!hasAutoFree) {
      sorted.unshift(FALLBACK_FREE_MODELS[0]);
    } else {
      const autoIndex = sorted.findIndex((m) => m.id === "openrouter/free");
      if (autoIndex > 0) {
        const [autoModel] = sorted.splice(autoIndex, 1);
        sorted.unshift(autoModel);
      }
    }

    return NextResponse.json({
      models: sorted.length > 0 ? sorted : FALLBACK_FREE_MODELS,
      source: "live",
      totalFree: sorted.length,
    });
  } catch (error) {
    console.warn("Failed to fetch models from OpenRouter:", error);
    return NextResponse.json({ models: FALLBACK_FREE_MODELS, source: "fallback" });
  }
}

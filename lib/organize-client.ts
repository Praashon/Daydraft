import { validateOrganizeResponse } from "./organize-response";
import { RequestTimeoutError, withDeadline } from "./request-deadline";

export interface OrganizeInput {
  text: string;
  provider: "openrouter" | "gemini";
  model?: string;
}

export async function requestOrganize(input: OrganizeInput, signal: AbortSignal) {
  try {
    return await withDeadline(async (requestSignal) => {
      const response = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: requestSignal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "The organizing service is unavailable. Please try again.";
        throw new Error(message);
      }
      validateOrganizeResponse(data);
      return data;
    }, 45_000, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof RequestTimeoutError) {
      throw new Error("Organizing took too long. Your text is still here. Try again or choose another AI model in Settings.");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not connect. Check your connection and try again. Your text is still here.");
    }
    throw error;
  }
}

import { GoogleGenAI } from "@google/genai";
import { AIOrganizeResponse, Task, Priority } from "@/types";
import { generateId } from "./utils";

const SYSTEM_PROMPT = `You are the quiet, intelligent cognitive engine of Daydraft, a premium productivity system.
Your job is to transform raw, unfiltered, chaotic human thoughts and "brain dumps" into an impeccably organized, calm, and actionable structure.

You must not act as a conversational chatbot. Do not say "Hello", "Sure", or include any conversational filler.
Return ONLY a valid JSON object strictly matching this schema:

{
  "tasks": [
    {
      "id": "unique-id",
      "title": "Clear, actionable task title starting with an active verb (do not just copy verbatim text)",
      "priority": "high | medium | low",
      "deadline": "Extracted deadline string or null/empty if none",
      "category": "Work | Academics | Personal | Health | Errands | Finance | Other",
      "completed": false
    }
  ],
  "focusTask": {
    "title": "Title of the single most crucial task to tackle first",
    "reason": "1 short, clear sentence explaining why this task takes precedence"
  },
  "dailyPlan": [
    {
      "time": "HH:MM",
      "task": "Task title",
      "description": "Short 1-line guidance on approach or context"
    }
  ],
  "insight": "1 short, clear sentence offering strategic perspective on today's goals. Do not repeat the tasks, synthesize the intent.",
  "notes": [
    {
      "id": "unique-id-note",
      "title": "A beautiful, overarching heading summarizing the themes of the user's notes/questions",
      "content": "Detailed content containing all the facts, calculations, and answers clearly formatted."
    }
  ]
}

Rules:
- High priority: strict immediate deadlines, high impact, or blocking items.
- Medium priority: important but flexible within 2-3 days.
- Low priority: quick errands, casual check-ins, or routine maintenance.
- Synthesize and compress the raw thoughts into crisp, professional task titles. Do not just copy the user's input word-for-word.

NOTES RULES - READ CAREFULLY AND FOLLOW WITHOUT EXCEPTION:
1. Scan the ENTIRE brain dump for every question, calculation, fact request, thought, or curiosity.
2. If there are notes, questions, or facts requested, generate EXACTLY ONE note object in the "notes" array that consolidates everything from this brain dump.
3. The "title" MUST be a beautiful, overarching heading summarizing the theme of their thoughts (e.g., "Physics Exploration & Daily Musings", "Travel Logistics & Math Calculations").
4. The "content" MUST contain all the individual questions and their detailed, factual answers, separated clearly (e.g., using "Q:" and "A:" or bullet points).
5. You MUST answer EVERY SINGLE ONE of their questions. Do not skip any. Show formulas for math/science. Give definitive factual answers.
6. IF the user explicitly asks for "just notes", or ends their prompt indicating they ONLY want notes (e.g., "just notes"), you MUST return empty arrays for "tasks" and "dailyPlan", and an empty object or dummy object for "focusTask". Only provide the "notes" and "insight".

- Return ONLY the JSON object. No surrounding markdown backticks if possible, but if included, ensure valid JSON.`;

export function generateLocalFallback(input: string): AIOrganizeResponse {
  const cleanInput = input.trim();
  if (!cleanInput) {
    return {
      tasks: [],
      focusTask: { title: "Define your main goal", reason: "Start with one clear intention for today." },
      dailyPlan: [],
      insight: "Take a breath. When ready, write down whatever is occupying your thoughts.",
    };
  }

  const rawClauses = cleanInput
    .split(/\n+|\.|\band\b|;|,/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && !/^(also|so|maybe|probably|just|then)$/i.test(s));

  const clauses = rawClauses.length > 0 ? rawClauses : [cleanInput];

  const tasks: Task[] = clauses.slice(0, 8).map((clause, idx) => {
    const lower = clause.toLowerCase();

    let priority: Priority = "medium";
    if (/urgent|asap|important|crucial|by friday|by tomorrow|today|deadline|exam|presentation|assignment|must|immediately/i.test(lower)) {
      priority = "high";
    } else if (/probably|maybe|later|sometime|call|friend|read|workout|clean|grocery|groceries|snack|stretch/i.test(lower)) {
      priority = idx === 0 ? "high" : "low";
    }

    let deadline: string | undefined = undefined;
    const deadlineMatch = clause.match(/\b(by\s+[a-zA-Z]+|tonight|today|tomorrow|this weekend|next week|at\s+\d+(:?\d+)?\s*(am|pm)?)\b/i);
    if (deadlineMatch) {
      deadline = deadlineMatch[0].replace(/^by\s+/i, "By ").replace(/^\w/, (c) => c.toUpperCase());
    }

    let category = "Personal";
    if (/assignment|react|code|dev|study|class|exam|homework|paper/i.test(lower)) category = "Academics";
    else if (/meeting|client|presentation|report|investor|deck|bug|review|email|work/i.test(lower)) category = "Work";
    else if (/workout|gym|run|fitness|health|doctor|dentist|sleep/i.test(lower)) category = "Health";
    else if (/buy|groceries|order|shop|clean|post office|errand/i.test(lower)) category = "Errands";
    else if (/budget|tax|invoice|bill|pay|bank/i.test(lower)) category = "Finance";

    let title = clause
      .replace(/^i (need to|should|want to|have to|must|will|am going to|ought to)\s+/i, "")
      .replace(/^and\s+/i, "")
      .trim();

    if (title.length > 50) {
      const words = title.split(/\s+/);
      title = words.slice(0, 7).join(" ") + "...";
    }

    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
      id: generateId(),
      title,
      priority,
      deadline,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
    };
  });

  const highPriority = tasks.find((t) => t.priority === "high") || tasks[0] || {
    id: generateId(),
    title: "Focus on your primary priority",
    priority: "high",
    completed: false,
  };

  const focusTask = {
    title: highPriority.title,
    reason: highPriority.deadline
      ? `Has an impending deadline (${highPriority.deadline}) and delivers the highest immediate relief.`
      : "Demands peak cognitive focus early in your day before context-switching sets in.",
    taskId: highPriority.id,
  };

  const times = ["09:00", "11:30", "14:00", "16:30", "19:00"];
  const dailyPlan = tasks.slice(0, 5).map((t, index) => {
    let desc = "Dedicated execution block";
    if (t.priority === "high") desc = "High-leverage focus block - eliminate distractions";
    else if (t.category === "Errands") desc = "Midday movement & physical reset";
    else if (t.category === "Health") desc = "Recharge energy and physical vitality";
    else if (t.category === "Personal") desc = "Social connection and evening wind-down";

    return {
      time: times[index] || "18:00",
      task: t.title,
      description: desc,
      completed: false,
    };
  });

  const highCount = tasks.filter((t) => t.priority === "high").length;
  let insight = "You have a balanced day ahead. Start with your primary priority to create momentum.";
  if (highCount >= 2) {
    insight = `You have ${highCount} high-leverage items today. Protect your morning for deep work before handling secondary requests.`;
  } else if (tasks.length <= 2) {
    insight = "A light and deliberate workload today. Take your time to execute with precision and preserve mental energy.";
  }

  const notes = [];
  if (cleanInput.toLowerCase().includes("distance")) {
    notes.push({
      id: generateId(),
      title: "Distance Information",
      content: "Distance calculation requires AI. Please configure an API key for accurate distance and facts.",
      createdAt: new Date().toISOString(),
    });
  } else if (cleanInput.toLowerCase().includes("calculate") || /\d+\s*[\+\-\*\/]\s*\d+/.test(cleanInput)) {
    notes.push({
      id: generateId(),
      title: "Calculation",
      content: "Math calculation requires AI to process the natural language. Please configure an API key.",
      createdAt: new Date().toISOString(),
    });
  }

  return {
    tasks,
    focusTask,
    dailyPlan,
    insight,
    notes,
  };
}

function sanitizeOrganizeResponse(parsed: any): AIOrganizeResponse {
  const cleanText = (value: unknown, fallback = "") =>
    typeof value === "string" ? value.replace(/\u2014/g, " - ") : fallback;

  const sanitizedTasks: Task[] = (parsed.tasks || []).map((t: any) => ({
    id: generateId(),
    title: cleanText(t.title, "Untitled task"),
    priority: ["high", "medium", "low"].includes(t.priority) ? t.priority : "medium",
    deadline: cleanText(t.deadline) || undefined,
    category: cleanText(t.category, "General"),
    completed: false,
    createdAt: new Date().toISOString(),
  }));

  const sanitizedNotes = (parsed.notes || []).map((n: any) => ({
    id: generateId(),
    title: cleanText(n.title, "Information"),
    content: cleanText(n.content),
    createdAt: new Date().toISOString(),
  }));

  let focusTask = undefined;
  if (parsed.focusTask?.title || sanitizedTasks.length > 0) {
    focusTask = {
      title: cleanText(parsed.focusTask?.title, sanitizedTasks[0]?.title || "Primary focus"),
      reason: cleanText(parsed.focusTask?.reason, "Highest cognitive priority for today."),
      taskId: sanitizedTasks[0]?.id,
    };
  }

  return {
    tasks: sanitizedTasks,
    focusTask: focusTask as any,
    dailyPlan: (parsed.dailyPlan || []).map((p: any) => ({
      id: generateId(),
      time: cleanText(p.time, "09:00"),
      task: cleanText(p.task, "Task"),
      description: cleanText(p.description) || undefined,
      completed: false,
    })),
    insight: cleanText(
      parsed.insight,
      "You have a well-structured set of priorities today. Focus on one task at a time."
    ),
    notes: sanitizedNotes.length > 0 ? sanitizedNotes : undefined,
  };
}

export async function organizeWithOpenRouter(
  text: string,
  apiKey: string,
  model: string = "openrouter/free"
): Promise<AIOrganizeResponse> {
  const selectedModel = model || "openrouter/free";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://daydraft.net",
      "X-Title": "Daydraft",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Here is the user's brain dump:\n"${text}"`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `OpenRouter API returned status ${response.status}`
    );
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "";

  const cleanedContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON structure found in OpenRouter AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return sanitizeOrganizeResponse(parsed);
}

export interface OrganizeOptions {
  provider?: "openrouter" | "gemini";
  apiKey?: string;
  model?: string;
}

export async function organizeThoughts(
  text: string,
  optionsOrKey?: string | OrganizeOptions
): Promise<AIOrganizeResponse> {
  const options: OrganizeOptions =
    typeof optionsOrKey === "string"
      ? { apiKey: optionsOrKey, provider: "gemini" }
      : optionsOrKey || {};

  const provider = options.provider || "openrouter";

  if (provider === "openrouter") {
    const openRouterKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      try {
        return await organizeWithOpenRouter(text, openRouterKey, options.model);
      } catch (error) {
        console.warn("OpenRouter API call failed; falling back to local NLP engine:", error);
        return generateLocalFallback(text);
      }
    }
  }

  if (provider === "gemini") {
    const geminiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiKey });
        const response = await client.models.generateContent({
          model: options.model || "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nHere is the user's brain dump:\n"${text}"`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text || "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON structure found in Gemini AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return sanitizeOrganizeResponse(parsed);
      } catch (error) {
        console.warn("Gemini API call failed; falling back to local NLP engine:", error);
        return generateLocalFallback(text);
      }
    }
  }

  return generateLocalFallback(text);
}

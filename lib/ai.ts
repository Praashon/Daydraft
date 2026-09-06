import { GoogleGenAI } from "@google/genai";
import { AIOrganizeResponse, Task, Priority, DailyPlanItem, FocusTask } from "@/types";
import { generateId } from "./utils";

const SYSTEM_PROMPT = `You are the quiet, intelligent cognitive engine of Daydraft, a premium productivity system.
Your job is to transform raw, unfiltered, chaotic human thoughts and "brain dumps" into an impeccably organized, calm, and actionable structure.

You must not act as a conversational chatbot. Do not say "Hello", "Sure", or include any conversational filler.
Return ONLY a valid JSON object strictly matching this schema:

{
  "tasks": [
    {
      "id": "task_1",
      "title": "Clear, actionable task title starting with an active verb",
      "priority": "high | medium | low",
      "deadline": "Extracted deadline string or null/empty if none",
      "category": "Work | Academics | Personal | Health | Errands | Finance | Other",
      "completed": false
    }
  ],
  "focusTask": {
    "title": "Title of the single most crucial task to tackle first",
    "reason": "1 short, clear sentence explaining why this task takes precedence",
    "taskId": "task_1"
  },
  "dailyPlan": [
    {
      "time": "HH:MM",
      "task": "Task title directly mapping to one of the tasks above",
      "description": "Short 1-line guidance on approach or context",
      "taskId": "task_1"
    }
  ],
  "insight": "1 short, clear sentence offering strategic perspective on today's goals. Do not repeat the tasks, synthesize the intent.",
  "notes": [
    {
      "id": "note_1",
      "title": "A beautiful, overarching heading summarizing the themes of the user's notes/questions",
      "content": "Detailed content containing all the facts, calculations, and answers clearly formatted."
    }
  ]
}

CRITICAL RULES FOR TASKS:
1. ATOMIC TASKS: NEVER merge or concatenate multiple distinct activities, projects, topics, or goals into a single run-on task.
2. If the user mentions working on a project, configuring gaming, evaluating AI tokens, studying, running errands, create SEPARATE atomic task objects for EACH distinct item.
3. Every task title must be concise, crisp, and start with an active imperative verb (e.g. "Define store requirements for Project Quivo", "Set up FIFA gaming station", "Evaluate AI Token options").
4. Assign accurate categories: "Work" for business, coding, project specifications; "Personal" for gaming, hobbies, leisure; "Finance" for crypto, tokens, budgeting, invoices; "Academics" for school, exams, homework; "Health" for fitness, gym, doctor; "Errands" for groceries, shopping, chores.
5. High priority: strict immediate deadlines, high impact, or blocking items. Medium priority: important but flexible within 2-3 days. Low priority: quick errands, leisure, or routine maintenance.

CRITICAL RULES FOR DAILY PLAN:
1. Every item in "dailyPlan" MUST directly link to one task in the "tasks" array.
2. The "taskId" property in "dailyPlan" MUST match the "id" of the corresponding task (e.g. "task_1").
3. Distribute the daily plan across sensible realistic working hours (e.g. "09:00", "10:30", "13:00", "15:00", "17:00").

NOTES RULES:
1. Scan the ENTIRE brain dump for every question, calculation, fact request, thought, or curiosity.
2. If there are notes, questions, or facts requested, generate EXACTLY ONE note object in the "notes" array that consolidates everything from this brain dump.
3. The "title" MUST be a beautiful, overarching heading summarizing the theme of their thoughts (e.g. "Lenovo Legion 5 Pro Specifications and Pricing").
4. The "content" MUST contain all the individual questions and their detailed, factual answers, separated clearly with bullet points or Q and A formatting.
5. Answer every question directly with factual precision.
6. If the user explicitly asks for "just notes", return empty arrays for "tasks" and "dailyPlan", and only provide "notes" and "insight".

Return ONLY the JSON object.`;

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
    else if (/meeting|client|presentation|report|investor|deck|bug|review|email|work|quivo|store/i.test(lower)) category = "Work";
    else if (/workout|gym|run|fitness|health|doctor|dentist|sleep/i.test(lower)) category = "Health";
    else if (/buy|groceries|order|shop|clean|post office|errand/i.test(lower)) category = "Errands";
    else if (/budget|tax|invoice|bill|pay|bank|token|crypto/i.test(lower)) category = "Finance";

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

  const times = ["09:00", "10:30", "13:00", "15:00", "17:00"];
  const dailyPlan = tasks.slice(0, 5).map((t, index) => {
    let desc = "Dedicated execution block";
    if (t.priority === "high") desc = "High-leverage focus block - eliminate distractions";
    else if (t.category === "Errands") desc = "Midday movement and physical reset";
    else if (t.category === "Health") desc = "Recharge energy and physical vitality";
    else if (t.category === "Personal") desc = "Social connection and evening wind-down";

    return {
      id: generateId(),
      time: times[index] || "18:00",
      task: t.title,
      description: desc,
      completed: false,
      taskId: t.id,
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

  const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const taskIdMap = new Map<string, string>();

  const sanitizedTasks: Task[] = rawTasks.map((t: any, idx: number) => {
    const generated = generateId();
    if (t.id) taskIdMap.set(String(t.id), generated);
    taskIdMap.set(`task_${idx + 1}`, generated);
    return {
      id: generated,
      title: cleanText(t.title, "Untitled task"),
      priority: ["high", "medium", "low"].includes(t.priority) ? t.priority : "medium",
      deadline: cleanText(t.deadline) || undefined,
      category: cleanText(t.category, "General"),
      completed: false,
      createdAt: new Date().toISOString(),
    };
  });

  const sanitizedNotes = (parsed.notes || []).map((n: any) => ({
    id: generateId(),
    title: cleanText(n.title, "Information"),
    content: cleanText(n.content),
    createdAt: new Date().toISOString(),
  }));

  let focusTask = undefined;
  if (parsed.focusTask?.title || sanitizedTasks.length > 0) {
    const rawFocusTaskId = parsed.focusTask?.taskId ? String(parsed.focusTask.taskId) : undefined;
    const mappedTaskId = rawFocusTaskId ? taskIdMap.get(rawFocusTaskId) : undefined;
    focusTask = {
      title: cleanText(parsed.focusTask?.title, sanitizedTasks[0]?.title || "Primary focus"),
      reason: cleanText(parsed.focusTask?.reason, "Highest cognitive priority for today."),
      taskId: mappedTaskId || sanitizedTasks[0]?.id,
    };
  }

  const sanitizedDailyPlan: DailyPlanItem[] = (parsed.dailyPlan || []).map((p: any, idx: number) => {
    const planTitle = cleanText(p.task, "Task");
    let matchedTaskId: string | undefined = undefined;

    if (p.taskId && taskIdMap.has(String(p.taskId))) {
      matchedTaskId = taskIdMap.get(String(p.taskId));
    } else {
      const lowerPlanTitle = planTitle.toLowerCase();
      const matched = sanitizedTasks.find(
        (t) =>
          lowerPlanTitle.includes(t.title.toLowerCase()) ||
          t.title.toLowerCase().includes(lowerPlanTitle)
      );
      if (matched) {
        matchedTaskId = matched.id;
      } else if (sanitizedTasks.length > 0) {
        matchedTaskId = sanitizedTasks[idx % sanitizedTasks.length]?.id;
      }
    }

    return {
      id: generateId(),
      time: cleanText(p.time, "09:00"),
      task: planTitle,
      description: cleanText(p.description) || undefined,
      completed: false,
      taskId: matchedTaskId,
    };
  });

  return {
    tasks: sanitizedTasks,
    focusTask: focusTask as any,
    dailyPlan: sanitizedDailyPlan,
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

export interface RebalancePlanOptions {
  tasks: Task[];
  dailyPlan?: DailyPlanItem[];
  provider?: "openrouter" | "gemini";
  apiKey?: string;
  model?: string;
}

export interface RebalancePlanResponse {
  focusTask: FocusTask;
  dailyPlan: DailyPlanItem[];
  insight: string;
}

export function localRebalancePlan(
  tasks: Task[],
  existingPlan: DailyPlanItem[] = []
): RebalancePlanResponse {
  if (!tasks || tasks.length === 0) {
    return {
      focusTask: {
        title: "All tasks completed",
        reason: "Your workspace is clear. Take a breath or capture new thoughts.",
      },
      dailyPlan: [],
      insight: "All priorities are cleared. Take time to recharge or draft your next goals.",
    };
  }

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  if (incompleteTasks.length === 0) {
    return {
      focusTask: {
        title: "All tasks completed!",
        reason: "You've successfully completed all active priorities for today.",
      },
      dailyPlan: existingPlan.map((p) => ({ ...p, completed: true })),
      insight: "Outstanding momentum today. Every scheduled task has been checked off.",
    };
  }

  const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
  const sortedIncomplete = [...incompleteTasks].sort(
    (a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1)
  );

  const topTask = sortedIncomplete[0];
  const focusTask: FocusTask = {
    title: topTask.title,
    reason:
      topTask.priority === "high"
        ? (topTask.deadline
            ? `Immediate deadline (${topTask.deadline}) with highest leverage.`
            : "High impact priority demanding your immediate cognitive energy.")
        : "Next sequential priority in your schedule to maintain daily momentum.",
    taskId: topTask.id,
  };

  const times = ["09:00", "10:30", "13:00", "15:00", "17:00", "18:30"];
  const updatedPlan: DailyPlanItem[] = [];

  existingPlan.forEach((p) => {
    if (p.completed && p.taskId && completedTasks.some((t) => t.id === p.taskId)) {
      updatedPlan.push(p);
    }
  });

  sortedIncomplete.slice(0, 6).forEach((task, idx) => {
    const existingForTask = existingPlan.find(
      (p) => p.taskId === task.id || p.task.toLowerCase() === task.title.toLowerCase()
    );

    let desc = "Dedicated execution block";
    if (task.priority === "high") desc = "High-leverage focus block - eliminate distractions";
    else if (task.category === "Errands") desc = "Midday errand and active reset";
    else if (task.category === "Health") desc = "Recharge energy and physical vitality";
    else if (task.category === "Personal") desc = "Personal focus and evening wind-down";

    updatedPlan.push({
      id: existingForTask?.id || generateId(),
      time: existingForTask?.time || times[idx] || "18:00",
      task: task.title,
      description: existingForTask?.description || desc,
      completed: false,
      taskId: task.id,
    });
  });

  updatedPlan.sort((a, b) => a.time.localeCompare(b.time));

  const highIncompleteCount = incompleteTasks.filter((t) => t.priority === "high").length;
  let insight = `You have ${incompleteTasks.length} remaining tasks. Focus on "${topTask.title}" next.`;
  if (highIncompleteCount >= 2) {
    insight = `You have ${highIncompleteCount} high-priority tasks remaining. Protect your deep work focus.`;
  } else if (incompleteTasks.length === 1) {
    insight = `Final push for the day: finish "${topTask.title}" to wrap up today's goals.`;
  }

  return {
    focusTask,
    dailyPlan: updatedPlan,
    insight,
  };
}

export async function rebalancePlan(
  options: RebalancePlanOptions
): Promise<RebalancePlanResponse> {
  const { tasks, dailyPlan = [], provider = "openrouter", apiKey, model } = options;

  if (!tasks || tasks.length === 0) {
    return localRebalancePlan([], []);
  }

  const prompt = `The user's tasks and daily schedule have been updated.
Current tasks:
${JSON.stringify(tasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority, completed: t.completed, category: t.category })), null, 2)}

Current daily schedule:
${JSON.stringify(dailyPlan.map((p) => ({ time: p.time, task: p.task, completed: p.completed, taskId: p.taskId })), null, 2)}

Rebalance the schedule and determine the next focus task.
Rules:
1. "focusTask": Select the single most important incomplete task to work on next, with a 1-sentence strategic reason and its matching "taskId". If all are completed, indicate that all are completed.
2. "dailyPlan": Provide realistic chronological schedule blocks for the tasks (format: "HH:MM", "task", "description", and exact "taskId" linking to the task id). Ensure remaining tasks have blocks assigned.
3. "insight": 1 concise, strategic sentence synthesizing today's remaining workload.

Return ONLY a valid JSON object matching:
{
  "focusTask": { "title": "...", "reason": "...", "taskId": "..." },
  "dailyPlan": [ { "time": "HH:MM", "task": "...", "description": "...", "taskId": "..." } ],
  "insight": "..."
}`;

  if (provider === "gemini") {
    const geminiKey = apiKey || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiKey });
        const response = await client.models.generateContent({
          model: model || "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });
        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            focusTask: parsed.focusTask || localRebalancePlan(tasks, dailyPlan).focusTask,
            dailyPlan:
              Array.isArray(parsed.dailyPlan) && parsed.dailyPlan.length > 0
                ? parsed.dailyPlan.map((p: any) => ({
                    id: generateId(),
                    time: p.time || "09:00",
                    task: p.task || "Task",
                    description: p.description,
                    completed: Boolean(p.completed),
                    taskId:
                      p.taskId ||
                      tasks.find(
                        (t) => t.title.toLowerCase() === (p.task || "").toLowerCase()
                      )?.id,
                  }))
                : localRebalancePlan(tasks, dailyPlan).dailyPlan,
            insight: parsed.insight || localRebalancePlan(tasks, dailyPlan).insight,
          };
        }
      } catch (e) {
        console.warn("Gemini rebalancePlan failed, falling back to local algorithm:", e);
      }
    }
  }

  if (provider === "openrouter") {
    const openRouterKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://daydraft.net",
            "X-Title": "Daydraft",
          },
          body: JSON.stringify({
            model: model || "openrouter/free",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          const rawContent = (data.choices?.[0]?.message?.content || "")
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .trim();
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              focusTask: parsed.focusTask || localRebalancePlan(tasks, dailyPlan).focusTask,
              dailyPlan:
                Array.isArray(parsed.dailyPlan) && parsed.dailyPlan.length > 0
                  ? parsed.dailyPlan.map((p: any) => ({
                      id: generateId(),
                      time: p.time || "09:00",
                      task: p.task || "Task",
                      description: p.description,
                      completed: Boolean(p.completed),
                      taskId:
                        p.taskId ||
                        tasks.find(
                          (t) => t.title.toLowerCase() === (p.task || "").toLowerCase()
                        )?.id,
                    }))
                  : localRebalancePlan(tasks, dailyPlan).dailyPlan,
              insight: parsed.insight || localRebalancePlan(tasks, dailyPlan).insight,
            };
          }
        }
      } catch (e) {
        console.warn("OpenRouter rebalancePlan failed, falling back to local algorithm:", e);
      }
    }
  }

  return localRebalancePlan(tasks, dailyPlan);
}


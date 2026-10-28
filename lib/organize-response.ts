import type { AIOrganizeResponse } from "@/types";

export class OrganizeError extends Error {
  constructor(message: string, public status = 502, public code = "INVALID_RESPONSE") {
    super(message);
    this.name = "OrganizeError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Check before normalizing: an empty or malformed response is not a plan.
// Notes-only responses are valid and need not include tasks or a focus task.
export function validateOrganizeContent(value: unknown): asserts value is Record<string, unknown> {
  const invalid = () => new OrganizeError(
    "The AI returned an empty or incomplete result. Please retry, or choose another model in Settings.",
  );
  if (!isRecord(value)) throw invalid();
  for (const field of ["tasks", "notes", "dailyPlan"]) {
    if (value[field] !== undefined && !Array.isArray(value[field])) throw invalid();
  }
  const tasks = (value.tasks ?? []) as unknown[];
  const notes = (value.notes ?? []) as unknown[];
  const plan = (value.dailyPlan ?? []) as unknown[];
  if (!tasks.length && !notes.length) throw invalid();
  if (tasks.some((t) => !isRecord(t) || !hasText(t.title))) throw invalid();
  if (notes.some((n) => !isRecord(n) || !hasText(n.title) || !hasText(n.content))) throw invalid();
  if (plan.some((p) => !isRecord(p) || !hasText(p.task) || !hasText(p.time))) throw invalid();
  if (value.focusTask != null && (!isRecord(value.focusTask) || typeof value.focusTask.title !== "string")) throw invalid();
  if (value.insight !== undefined && typeof value.insight !== "string") throw invalid();
}

export function validateOrganizeResponse(value: unknown): asserts value is AIOrganizeResponse {
  validateOrganizeContent(value);
  if (
    !Array.isArray(value.tasks) || !Array.isArray(value.dailyPlan) ||
    !isRecord(value.focusTask) || typeof value.focusTask.reason !== "string" ||
    typeof value.insight !== "string" ||
    value.tasks.some((t) => !isRecord(t) || !hasText(t.id) || !["high", "medium", "low"].includes(String(t.priority))) ||
    (Array.isArray(value.notes) && value.notes.some((n) => !isRecord(n) || !hasText(n.id)))
  ) {
    throw new OrganizeError("The server returned an incomplete result. Please try again.");
  }
}

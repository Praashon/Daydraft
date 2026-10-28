export class RequestTimeoutError extends Error {
  constructor() {
    super("The request took too long. Please try again.");
    this.name = "RequestTimeoutError";
  }
}

// Race as well as abort: even a dependency that ignores cancellation must not
// leave the caller waiting. Always remove listeners and timers on settlement.
export async function withDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(parentSignal?.reason);
  const timer = setTimeout(() => controller.abort(new RequestTimeoutError()), timeoutMs);
  parentSignal?.addEventListener("abort", cancel, { once: true });
  if (parentSignal?.aborted) cancel();

  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener("abort", onAbort, { once: true });
    if (controller.signal.aborted) onAbort();
  });

  try {
    return await Promise.race([
      aborted,
      Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return operation(controller.signal);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", cancel);
    controller.signal.removeEventListener("abort", onAbort);
  }
}

"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function ProcessingState({ onCancel }: { onCancel: () => void }) {
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsTakingLonger(true), 10_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-600/30 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:bg-zinc-950">
      <div role="status" aria-live="polite" className="flex min-w-0 items-start gap-3">
        <LoaderCircle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 animate-spin text-emerald-700 motion-reduce:animate-none dark:text-emerald-400" />
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Organizing your thoughts</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {isTakingLonger
              ? "Still waiting for a response. You can cancel and try again."
              : "Waiting for your AI provider to return tasks, notes, and answers."}
          </p>
        </div>
      </div>
      <button type="button" onClick={onCancel} className="min-h-11 shrink-0 self-start rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:self-auto">
        Cancel
      </button>
    </div>
  );
}

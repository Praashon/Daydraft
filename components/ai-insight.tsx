"use client";

import React from "react";
import { Lightbulb, X } from "lucide-react";

interface AIInsightProps {
  insight: string;
  onClose?: () => void;
}

export function AIInsight({ insight, onClose }: AIInsightProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 subtle-card-shadow">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#10B981] to-[#059669]" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Daily Intelligence"
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          title="Dismiss Daily Intelligence"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3.5 pl-1.5 pr-6">
        <div className="mt-0.5 w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="label-small uppercase tracking-wider text-emerald-500 font-semibold">
              Daily Intelligence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
            <span className="label-small text-zinc-500 dark:text-zinc-400">
              Live Strategy
            </span>
          </div>
          <p className="body-text text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
}

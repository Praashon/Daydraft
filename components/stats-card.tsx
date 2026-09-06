"use client";

import React from "react";
import { CheckCircle2, ListTodo, CircleDashed } from "lucide-react";
import { Stats } from "@/types";

interface StatsCardProps {
  stats: Stats;
}

export function StatsCard({ stats }: StatsCardProps) {
  const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 subtle-card-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="card-heading text-zinc-900 dark:text-zinc-100">Today&apos;s Progress</span>
        <span className="label-small text-emerald-600 dark:text-emerald-500 font-semibold bg-emerald-600/10 px-2.5 py-0.5 rounded-full">
          {percentage}% Done
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="label-small text-zinc-500 dark:text-zinc-400">Total</span>
            <ListTodo className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {stats.total}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="label-small text-zinc-500 dark:text-zinc-400">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-2xl font-semibold text-emerald-600 tracking-tight">
            {stats.completed}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="label-small text-zinc-500 dark:text-zinc-400">Remaining</span>
            <CircleDashed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          </div>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-500 tracking-tight">
            {stats.remaining}
          </span>
        </div>
      </div>

      <div className="mt-4 w-full bg-[#EAEAEA] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

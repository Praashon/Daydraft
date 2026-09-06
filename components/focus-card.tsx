"use client";

import React, { useState, useEffect } from "react";
import { FocusTask } from "@/types";
import { Play, Pause, CheckCircle2, Flame, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FocusCardProps {
  focusTask: FocusTask;
  onComplete?: () => void;
}

export function FocusCard({ focusTask, onComplete }: FocusCardProps) {
  const [isFocusing, setIsFocusing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFocusing && secondsLeft > 0 && !completed) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsFocusing(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusing, secondsLeft, completed]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleToggleTimer = () => {
    setIsFocusing(!isFocusing);
  };

  const handleResetTimer = () => {
    setIsFocusing(false);
    setSecondsLeft(25 * 60);
  };

  const handleComplete = () => {
    setCompleted(true);
    setIsFocusing(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 subtle-card-shadow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-600 dark:border-emerald-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 border border-emerald-600 dark:border-emerald-500/20">
            <Flame className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
            FOCUS FIRST
          </span>
          <span className="label-small text-zinc-500 dark:text-zinc-400">
            Single-task priority
          </span>
        </div>

        <AnimatePresence>
          {isFocusing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 label-small font-mono font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {formatTimer(secondsLeft)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-1.5 mb-4">
        <h3
          className={`page-heading text-zinc-900 dark:text-zinc-100 transition-all ${
            completed ? "line-through text-zinc-500 dark:text-zinc-400" : ""
          }`}
        >
          {focusTask.title}
        </h3>
        <p className="body-text text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {focusTask.reason}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          {!completed ? (
            <button
              onClick={handleToggleTimer}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer ${
                isFocusing
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#262626]"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isFocusing ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Focus ({formatTimer(secondsLeft)})
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start task
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 label-small font-medium py-2">
              <CheckCircle2 className="w-4 h-4" />
              Priority achieved today
            </span>
          )}

          {isFocusing && (
            <button
              onClick={handleResetTimer}
              title="Reset 25m focus timer"
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:bg-zinc-900 transition-all active:scale-90 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!completed && (
          <button
            onClick={handleComplete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark done
          </button>
        )}
      </div>
    </div>
  );
}

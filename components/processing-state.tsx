"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Brain,
  ListOrdered,
  CalendarClock,
  Compass,
  CalendarCheck,
} from "lucide-react";

interface ProcessingStateProps {
  onComplete?: () => void;
}

const STEPS = [
  { label: "Understanding your thoughts", icon: Brain },
  { label: "Extracting tasks", icon: ListOrdered },
  { label: "Finding deadlines", icon: CalendarClock },
  { label: "Organizing priorities", icon: Compass },
  { label: "Creating your plan", icon: CalendarCheck },
];

export function ProcessingState({ onComplete }: ProcessingStateProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 400);
          }
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-zinc-950 rounded-2xl sm:rounded-3xl border border-emerald-500/30 p-6 sm:p-8 subtle-ai-glow premium-card-shadow my-4"
    >
      <div className="flex items-center justify-between pb-5 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-sm">
            <Brain className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="card-heading text-zinc-900 dark:text-zinc-100">
              Quiet Intelligence at Work
            </h3>
            <p className="label-small text-zinc-500 dark:text-zinc-400">
              Turning mental chaos into structured clarity
            </p>
          </div>
        </div>
        <div className="label-small text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1 rounded-full">
          Step {Math.min(activeStep + 1, 5)} of 5
        </div>
      </div>

      <div className="space-y-4">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          const isPending = idx > activeStep;
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                isCurrent
                  ? "bg-emerald-600/5 border border-emerald-600 dark:border-emerald-500/20"
                  : isDone
                    ? "bg-zinc-50 dark:bg-zinc-900 border border-transparent"
                    : "opacity-40 border border-transparent"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-[#EAEAEA] text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <StepIcon className="w-3.5 h-3.5" />
                  </motion.span>
                ) : (
                  <StepIcon className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex-1 flex items-center justify-between">
                <span
                  className={`text-[14px] font-medium transition-colors ${
                    isCurrent
                      ? "text-emerald-600 dark:text-emerald-500 font-semibold"
                      : isDone
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="label-small text-emerald-600 dark:text-emerald-500 font-medium"
                  >
                    Processing...
                  </motion.span>
                )}

                {isDone && (
                  <span className="label-small text-emerald-600 font-medium">
                    Ready
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

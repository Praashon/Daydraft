"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Key, CheckCircle2, ArrowRight } from "lucide-react";
import { useAppContext } from "@/components/app-provider";

const steps = [
  {
    title: "Welcome to Daydraft",
    description: (
      <>
        Your new home for clear thoughts, focused tasks, and structured days.
        Let's take a quick look around.
      </>
    ),
    icon: <Sparkles className="w-8 h-8 text-emerald-500" />,
  },
  {
    title: "Unlock AI Superpowers",
    description: (
      <>
        Daydraft uses AI to automatically break down your messy brain-dumps into
        organized tasks and daily plans. Get a free API key from{" "}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
        >
          Google AI Studio
        </a>{" "}
        or{" "}
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
        >
          OpenRouter
        </a>
        , and add it in your Settings.
      </>
    ),
    icon: <Key className="w-8 h-8 text-amber-500" />,
  },
  {
    title: "You're all set!",
    description: (
      <>
        Start by typing a thought into the 'Draft your day' input at the top of
        the dashboard. Enjoy a calmer, more productive day.
      </>
    ),
    icon: <CheckCircle2 className="w-8 h-8 text-blue-500" />,
  },
];

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { setIsSettingsOpen } = useAppContext();

  useEffect(() => {
    // Only show if we are on the client and haven't seen it before
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("daydraft_onboarding_seen");
      if (!hasSeen) {
        // Small delay so it doesn't jarringly pop up instantly on load
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("daydraft_onboarding_seen", "true");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((c) => c + 1);
    } else {
      handleClose();
    }
  };

  const handleOpenSettings = () => {
    handleClose();
    setIsSettingsOpen(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
        >
          {/* Progress bar */}
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: "33%" }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  {steps[currentStep].icon}
                </div>
                <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {steps[currentStep].title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-3">
              {currentStep === 1 && (
                <button
                  onClick={handleOpenSettings}
                  className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Open Settings
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
              >
                {currentStep === steps.length - 1 ? "Let's Go!" : "Next"}
                {currentStep < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

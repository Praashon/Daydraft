"use client";

import React, { useState, useRef, useEffect } from "react";
import { Priority } from "@/types";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PriorityOption {
  value: Priority;
  label: string;
  dotColor: string;
  activeTextColor: string;
  badgeBg: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: "high",
    label: "High Priority",
    dotColor: "bg-rose-500",
    activeTextColor: "text-rose-700",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200/60",
  },
  {
    value: "medium",
    label: "Medium Priority",
    dotColor: "bg-indigo-500",
    activeTextColor: "text-indigo-700",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  },
  {
    value: "low",
    label: "Low Priority",
    dotColor: "bg-neutral-400",
    activeTextColor: "text-neutral-700",
    badgeBg: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
  },
];

interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  variant?: "canvas" | "white";
  className?: string;
  id?: string;
}

export function PrioritySelect({
  value,
  onChange,
  variant = "canvas",
  className = "",
  id,
}: PrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    PRIORITY_OPTIONS.find((opt) => opt.value === value) || PRIORITY_OPTIONS[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const bgStyles =
    variant === "canvas"
      ? "bg-zinc-50 dark:bg-zinc-900 hover:bg-white dark:bg-zinc-950"
      : "bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:bg-zinc-900";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left font-sans ${className}`}
    >
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 text-xs font-medium cursor-pointer select-none focus:outline-none ${bgStyles} ${
          isOpen
            ? "border-emerald-600 dark:border-emerald-500 ring-2 ring-[#059669]/15 shadow-xs"
            : "border-zinc-200 dark:border-zinc-800 hover:border-[#D4D4D4]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${currentOption.dotColor} shrink-0 transition-transform duration-150 ${
              isOpen ? "scale-110" : "scale-100"
            }`}
          />
          <span className="text-zinc-900 dark:text-zinc-100 font-medium tracking-tight">
            {currentOption.label}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-zinc-900 dark:text-zinc-100" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className="absolute left-0 top-full mt-1.5 min-w-[170px] w-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/8 p-1 z-50 overflow-hidden font-sans"
          >
            {PRIORITY_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 font-semibold"
                      : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${opt.dotColor} shrink-0`}
                    />
                    <span>{opt.label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

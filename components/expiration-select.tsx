"use client";

import React, { useState, useRef, useEffect } from "react";
import { TrashExpiration } from "@/types";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ExpirationOption {
  value: TrashExpiration;
  label: string;
}

export const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { value: "No expiration", label: "No expiration" },
  { value: "1 week", label: "1 week" },
  { value: "30 days", label: "30 days" },
  { value: "6 months", label: "6 months" },
  { value: "1 year", label: "1 year" },
];

interface ExpirationSelectProps {
  value: TrashExpiration;
  onChange: (value: TrashExpiration) => void;
  variant?: "canvas" | "white";
  className?: string;
  id?: string;
}

export function ExpirationSelect({
  value,
  onChange,
  variant = "canvas",
  className = "",
  id,
}: ExpirationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    EXPIRATION_OPTIONS.find((opt) => opt.value === value) || EXPIRATION_OPTIONS[0];

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
          <span className="text-zinc-900 dark:text-zinc-100 font-medium tracking-tight">
            Auto-delete: {currentOption.label}
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
            className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 min-w-[170px] w-full max-w-[200px] bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/8 p-1 z-50 overflow-hidden font-sans"
          >
            {EXPIRATION_OPTIONS.map((opt) => {
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

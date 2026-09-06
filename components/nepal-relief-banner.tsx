"use client";

import React, { useState } from "react";

// The relief banner campaign ends on 30 September 2026 (Nepal time)
const EXPIRY_TIME = new Date("2026-09-30T23:59:59+05:45").getTime();

export function NepalReliefBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  // Take itself down after 30 September 2026 or if dismissed
  if (isDismissed || Date.now() >= EXPIRY_TIME) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Nepal disaster relief notice"
      className="relative w-full z-50 bg-[#eaf0ff] dark:bg-[#0d1b3e] text-[#1e293b] dark:text-[#dbe4f5] border-b border-[#1F5FF7]/15 dark:border-[#9dbaff]/20 text-[13px] sm:text-[14px] leading-snug transition-colors"
    >
      <div className="max-w-7xl mx-auto px-10 sm:px-14 py-2 flex items-center justify-center gap-2 text-center">
        {/* Heart icon */}
        <svg
          className="w-3.5 h-3.5 text-[#1a4fdb] dark:text-[#9dbaff] shrink-0 hidden sm:inline-block"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>

        <p className="m-0">
          <a
            href="https://pmdrf.nchl.com.np/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1a4fdb] dark:text-[#9dbaff] font-medium underline underline-offset-2 decoration-[#1F5FF7]/35 dark:decoration-[#9dbaff]/40 hover:decoration-[#1a4fdb] dark:hover:decoration-[#9dbaff] transition-colors focus-visible:outline-2 focus-visible:outline-[#1a4fdb] dark:focus-visible:outline-[#9dbaff] rounded-xs inline-flex items-center gap-1"
          >
            <span>
              Donate to the Government of Nepal Prime Minister&apos;s Disaster
              Relief Fund
            </span>
            <svg
              className="w-3.5 h-3.5 inline-block shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 7h10v10M7 17 17 7" />
            </svg>
          </a>
        </p>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss the Nepal relief notice"
          className="absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#1a4fdb] dark:focus-visible:outline-[#9dbaff] cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

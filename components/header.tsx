"use client";

import React from "react";
import { formatCurrentDate, getGreeting } from "@/lib/utils";
import { Calendar as CalendarIcon, Menu } from "lucide-react";
import { ActiveView } from "@/types";

interface HeaderProps {
  userName?: string;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenMobileMenu?: () => void;
}

export function Header({
  userName = "",
  onOpenMobileMenu,
}: HeaderProps) {
  const { greeting, subtext } = getGreeting(userName);
  const formattedDate = formatCurrentDate();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-zinc-200 dark:border-zinc-800 mb-8 transition-colors">
      <div className="flex items-start gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="hero-heading text-zinc-900 dark:text-zinc-100">{greeting}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 label-small text-zinc-500 dark:text-zinc-400 transition-colors">
              <CalendarIcon className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              {formattedDate}
            </span>
          </div>
          <p className="body-text text-zinc-500 dark:text-zinc-400 mt-1">{subtext}</p>
        </div>
      </div>
    </header>
  );
}

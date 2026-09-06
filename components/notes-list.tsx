"use client";

import React, { useState } from "react";
import { Note } from "@/types";
import { Lightbulb, Info, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";

interface NotesListProps {
  notes: Note[];
  onClose?: () => void;
}

export function NotesList({ notes, onClose }: NotesListProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  if (!notes || notes.length === 0) return null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 subtle-card-shadow transition-all relative">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="card-heading text-zinc-900 dark:text-zinc-100">
            Extracted Notes &amp; Calculations
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
            title="Dismiss to Notes page"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notes.map((note) => {
          const isExpanded = expandedNotes.has(note.id);
          const isLong = note.content && note.content.length > 120;

          return (
            <div
              key={note.id}
              className="p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {isLong && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(note.id, e)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Collapse</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Expand</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                      <Link
                        href={`/notes/${note.id}`}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                        title="Open full note"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                  <p
                    className={`text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap ${
                      !isExpanded && isLong ? "line-clamp-3" : ""
                    }`}
                  >
                    {note.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

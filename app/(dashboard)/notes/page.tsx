"use client";

import React, { useState, useMemo } from "react";
import { useAppContext } from "@/components/app-provider";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Info, Trash2, CheckSquare, Square, Calendar, Clock, Search, X } from "lucide-react";
import Link from "next/link";
import { Note } from "@/types";

function getDateGroupKey(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return "unknown";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateHeader(dateKey: string, sampleDateStr?: string): { label: string; sublabel?: string } {
  if (dateKey === "unknown") return { label: "Undated Notes" };
  const d = sampleDateStr ? new Date(sampleDateStr) : new Date(`${dateKey}T00:00:00`);
  if (isNaN(d.getTime())) return { label: dateKey };

  const now = new Date();
  const todayKey = getDateGroupKey(now.toISOString());

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = getDateGroupKey(yesterday.toISOString());

  const formattedFull = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (dateKey === todayKey) {
    return { label: "Today", sublabel: formattedFull };
  }
  if (dateKey === yesterdayKey) {
    return { label: "Yesterday", sublabel: formattedFull };
  }
  return { label: formattedFull };
}

function formatNoteTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function NotesPage() {
  const { notes, handleDeleteNote, handleBatchDeleteNotes } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const allNotes = notes || [];

  const displayedNotes = useMemo(() => {
    if (!searchQuery.trim()) return allNotes;
    const q = searchQuery.toLowerCase().trim();
    return allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
    );
  }, [allNotes, searchQuery]);

  const dateGroups = useMemo(() => {
    const map = new Map<string, Note[]>();

    displayedNotes.forEach((note) => {
      const key = getDateGroupKey(note.createdAt);
      const existing = map.get(key) || [];
      existing.push(note);
      map.set(key, existing);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return b.localeCompare(a);
    });

    return sortedKeys.map((key) => {
      const groupNotes = (map.get(key) || []).sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      const headerInfo = formatDateHeader(key, groupNotes[0]?.createdAt);
      return {
        dateKey: key,
        header: headerInfo,
        notes: groupNotes,
      };
    });
  }, [displayedNotes]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectGroup = (groupNotes: Note[]) => {
    const groupIds = groupNotes.map((n) => n.id);
    const allGroupSelected = groupIds.every((id) => selectedIds.has(id));
    const newSelected = new Set(selectedIds);

    if (allGroupSelected) {
      groupIds.forEach((id) => newSelected.delete(id));
    } else {
      groupIds.forEach((id) => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedNotes.length && displayedNotes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedNotes.map((n) => n.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size > 0) {
      handleBatchDeleteNotes(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-heading text-zinc-900 dark:text-zinc-100">Notes &amp; Calculations</h2>
          <p className="body-text text-zinc-500 dark:text-zinc-400">
            All your extracted notes, ideas, and calculations from brain dumps.
          </p>
        </div>

        {displayedNotes.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {selectedIds.size === displayedNotes.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === displayedNotes.length ? "Deselect All" : "Select All"}
            </button>
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleBatchDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {allNotes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, calculations, topics..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {displayedNotes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center subtle-card-shadow flex flex-col items-center justify-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {searchQuery ? "No matching notes" : "No notes yet"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2">
            {searchQuery
              ? `No notes or calculations match "${searchQuery}". Try a different keyword.`
              : "Notes and calculations extracted from your brain dumps will appear here."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {dateGroups.map((group) => {
            const isAllGroupSelected =
              group.notes.length > 0 &&
              group.notes.every((n) => selectedIds.has(n.id));
            const isSomeGroupSelected =
              group.notes.some((n) => selectedIds.has(n.id)) && !isAllGroupSelected;

            return (
              <section key={group.dateKey} className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {group.header.label}
                      </h3>
                      {group.header.sublabel && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                          • {group.header.sublabel}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSelectGroup(group.notes)}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer"
                  >
                    {isAllGroupSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    <span>{isAllGroupSelected ? "Deselect date" : "Select date"}</span>
                  </button>
                </div>

                <div className="space-y-3.5">
                  {group.notes.map((note) => {
                    const isSelected = selectedIds.has(note.id);
                    const noteTime = formatNoteTime(note.createdAt);
                    const noteDate = new Date(note.createdAt || new Date()).toLocaleDateString();

                    return (
                      <Link
                        href={`/notes/${note.id}`}
                        key={note.id}
                        className={`block p-5 rounded-2xl border subtle-card-shadow relative group transition-all ${
                          isSelected
                            ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={(e) => toggleSelect(note.id, e)}
                            className="mt-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors z-10 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 pr-12 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
                              {note.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed mb-3 line-clamp-2">
                              {note.content}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                              <span>
                                Extracted on {noteDate}
                                {noteTime ? ` at ${noteTime}` : ""}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 z-10 cursor-pointer"
                            title="Move to trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}


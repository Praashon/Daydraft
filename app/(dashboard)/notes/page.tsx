"use client";

import React, { useState } from "react";
import { useAppContext } from "@/components/app-provider";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Info, Trash2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";

export default function NotesPage() {
  const { notes, handleDeleteNote, handleBatchDeleteNotes } = useAppContext();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const displayedNotes = notes || [];

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

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedNotes.length && displayedNotes.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedNotes.map(n => n.id)));
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
          <h2 className="page-heading text-zinc-900 dark:text-zinc-100">Notes & Calculations</h2>
          <p className="body-text text-zinc-500 dark:text-zinc-400">
            All your extracted notes, ideas, and calculations from brain dumps.
          </p>
        </div>

        {displayedNotes.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {selectedIds.size === displayedNotes.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All
            </button>
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleBatchDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedIds.size})
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {displayedNotes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center subtle-card-shadow flex flex-col items-center justify-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No notes yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2">
            Notes and calculations extracted from your brain dumps will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedNotes.map((note) => {
            const isSelected = selectedIds.has(note.id);
            return (
              <Link
                href={`/notes/${note.id}`}
                key={note.id}
                className={`block p-5 rounded-2xl border subtle-card-shadow relative group transition-all ${
                  isSelected 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' 
                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={(e) => toggleSelect(note.id, e)}
                    className="mt-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors z-10"
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
                      <span>Extracted on {new Date(note.createdAt || new Date()).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 z-10"
                    title="Move to trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

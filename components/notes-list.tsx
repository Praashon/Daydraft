import React from "react";
import { Note } from "@/types";
import { Lightbulb, Info, X } from "lucide-react";
import Link from "next/link";

interface NotesListProps {
  notes: Note[];
  onClose?: () => void;
}

export function NotesList({ notes, onClose }: NotesListProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-950/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-all relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Extracted Notes & Calculations
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Dismiss to Notes page"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <Link
            href={`/notes/${note.id}`}
            key={note.id}
            className="block p-4 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700/80 border border-gray-100 dark:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Info className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
                  {note.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap line-clamp-2">
                  {note.content}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

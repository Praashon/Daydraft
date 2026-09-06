"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/components/app-provider";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Info, Calendar } from "lucide-react";
import { Note } from "@/types";

export default function NoteDetailPage() {
  const { notes, handleDeleteNote } = useAppContext();
  const params = useParams();
  const router = useRouter();
  
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    if (params.id) {
      const foundNote = notes.find((n) => n.id === params.id);
      if (foundNote) {
        setNote(foundNote);
      }
    }
  }, [params.id, notes]);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center p-12 mt-12 text-center">
        <p className="text-zinc-500 mb-4">Note not found or deleted.</p>
        <button
          onClick={() => router.push("/notes")}
          className="text-emerald-600 hover:underline"
        >
          Return to Notes
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    handleDeleteNote(note.id);
    router.push("/notes");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto pb-12"
    >
      <button
        onClick={() => router.push("/notes")}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all notes
      </button>

      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 shadow-sm relative">
        <button
          onClick={handleDelete}
          className="absolute top-8 right-8 p-2.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all focus:outline-none"
          title="Move to trash"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-1">
            <Info className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="pr-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-tight">
              {note.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Calendar className="w-4 h-4" />
              <span>{new Date(note.createdAt).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80 mb-8" />

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-[15px] sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {note.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

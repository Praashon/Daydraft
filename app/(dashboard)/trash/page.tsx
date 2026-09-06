"use client";

import React from "react";
import { useAppContext } from "@/components/app-provider";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Trash,
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ExpirationSelect } from "@/components/expiration-select";

export default function TrashPage() {
  const { trash, restoreFromTrash, permanentlyDeleteFromTrash, user, setUser } = useAppContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-heading text-zinc-900 dark:text-zinc-100">Trash</h2>
          <p className="body-text text-zinc-500 dark:text-zinc-400">
            Recover deleted items or permanently remove them.
          </p>
        </div>
        
        <ExpirationSelect
          value={user.trashExpiration || "No expiration"}
          onChange={(val) => setUser({ ...user, trashExpiration: val })}
        />
      </div>

      {trash.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center subtle-card-shadow flex flex-col items-center justify-center">
          <Trash className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Trash is empty</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mt-2">
            Items you delete from your dashboard or notes will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trash.map((item) => {
            const isCompleted = item.task?.completed || item.planItem?.completed;
            const hasStatus = item.task !== undefined || item.planItem !== undefined;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 subtle-card-shadow flex flex-col sm:flex-row gap-4 justify-between sm:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                    <Trash className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {item.task?.title || item.planItem?.task || item.note?.title || "Unknown Item"}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        {item.type === "task" && <CheckSquare className="w-3.5 h-3.5" />}
                        {item.type === "planItem" && <CalendarIcon className="w-3.5 h-3.5" />}
                        {item.type === "both" && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.type === "note" && <BookOpen className="w-3.5 h-3.5" />}

                        {item.type === "task" && "Task"}
                        {item.type === "planItem" && "Calendar Block"}
                        {item.type === "both" && "Task & Calendar"}
                        {item.type === "note" && "Note"}
                      </span>

                      {hasStatus && (
                        <>
                          <span>•</span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[11px] font-medium border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </>
                      )}

                      <span>•</span>
                      <span>Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <button
                  onClick={() => restoreFromTrash(item.id)}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  onClick={() => permanentlyDeleteFromTrash(item.id)}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-100 dark:border-red-500/20"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

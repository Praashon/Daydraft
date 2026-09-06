"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Archive, CheckCircle2, Clock } from "lucide-react";
import { Task, DailyPlanItem } from "@/types";

interface DeleteConfirmationModalProps {
  task?: Task;
  tasks?: Task[];
  planItems?: DailyPlanItem[];
  hasLinkedSchedule?: boolean;
  onClose: () => void;
  onDeleteDashboard?: () => void;
  onDeleteEverywhere?: () => void;
  onConfirm?: (options: { saveToTrash: boolean; alsoRemoveLinkedSchedule: boolean }) => void;
}

export function DeleteConfirmationModal({
  task,
  tasks,
  planItems,
  hasLinkedSchedule,
  onClose,
  onDeleteDashboard,
  onDeleteEverywhere,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [alsoRemoveSchedule, setAlsoRemoveSchedule] = useState(true);

  const allTasks: Task[] = tasks && tasks.length > 0 ? tasks : task ? [task] : [];
  const allPlanItems: DailyPlanItem[] = planItems || [];
  const totalCount = allTasks.length + allPlanItems.length;

  const completedCount =
    allTasks.filter((t) => t.completed).length +
    allPlanItems.filter((p) => p.completed).length;
  const pendingCount = totalCount - completedCount;

  const handleSaveToTrash = () => {
    if (onConfirm) {
      onConfirm({ saveToTrash: true, alsoRemoveLinkedSchedule: alsoRemoveSchedule });
    } else if (alsoRemoveSchedule && onDeleteEverywhere) {
      onDeleteEverywhere();
    } else if (onDeleteDashboard) {
      onDeleteDashboard();
    }
  };

  const handleDeleteEntirely = () => {
    if (onConfirm) {
      onConfirm({ saveToTrash: false, alsoRemoveLinkedSchedule: alsoRemoveSchedule });
    } else if (onDeleteEverywhere) {
      onDeleteEverywhere();
    }
  };

  const isSingle = totalCount === 1;
  const singleTitle = allTasks[0]?.title || allPlanItems[0]?.task;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-50 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSingle ? "Delete Item" : `Delete ${totalCount} Selected Items`}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Choose whether to archive to Trash or permanently delete.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
              {isSingle ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    &ldquo;{singleTitle}&rdquo;
                  </span>
                  {completedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-medium shrink-0">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {completedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {completedCount} Completed
                      </span>
                    )}
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-medium">
                        <Clock className="w-3 h-3" />
                        {pendingCount} Pending
                      </span>
                    )}
                  </div>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1 max-h-24 overflow-y-auto pr-1">
                    {allTasks.slice(0, 4).map((t) => (
                      <li key={t.id} className="truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span className="truncate">{t.title}</span>
                      </li>
                    ))}
                    {allPlanItems.slice(0, 4).map((p, idx) => (
                      <li key={p.id || idx} className="truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate font-mono text-[10px] text-zinc-400">{p.time}</span>
                        <span className="truncate">{p.task}</span>
                      </li>
                    ))}
                    {totalCount > 4 && (
                      <li className="text-[11px] text-zinc-400 italic">
                        + {totalCount - 4} more items...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {hasLinkedSchedule && (
                <label className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300 select-none">
                  <input
                    type="checkbox"
                    checked={alsoRemoveSchedule}
                    onChange={(e) => setAlsoRemoveSchedule(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>Also remove linked block(s) from Today&apos;s Schedule & Calendar</span>
                </label>
              )}
            </div>

            <div className="space-y-2.5 mt-1">
              <button
                type="button"
                onClick={handleSaveToTrash}
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border-2 border-emerald-500/50 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800 mt-0.5">
                  <Archive className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Save to Trash / Archive
                    </span>
                    <span className="label-small text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Safely keeps your {completedCount > 0 && pendingCount > 0 ? "completed & pending items" : completedCount > 0 ? "completed items" : "pending items"} in Trash. You can review or restore them at any time.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDeleteEntirely}
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/60 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/60 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Delete Entirely
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Permanently wipe item(s) from workspace without keeping a copy in Trash.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

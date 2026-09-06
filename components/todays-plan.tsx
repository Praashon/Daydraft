"use client";

import React, { useState } from "react";
import { DailyPlanItem } from "@/types";
import { Clock, Check, Trash2, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "./app-provider";

interface TodaysPlanProps {
  plan: DailyPlanItem[];
  onTogglePlanItem?: (id: string) => void;
  onDeletePlanItem?: (id: string) => void;
  onBatchDeletePlanItems?: (ids: string[]) => void;
  selectedPlanIds?: Set<string>;
  onSelectPlanItem?: (id: string, selected: boolean) => void;
  onSelectAllPlanItems?: (ids: string[], selected: boolean) => void;
  onClearSelection?: () => void;
  hoveredTaskId?: string | null;
  onHoverPlanItem?: (taskId: string | null) => void;
}

export function TodaysPlan({
  plan,
  onTogglePlanItem,
  onDeletePlanItem,
  onBatchDeletePlanItems,
  selectedPlanIds: externalSelectedPlanIds,
  onSelectPlanItem,
  onSelectAllPlanItems,
  onClearSelection,
  hoveredTaskId,
  onHoverPlanItem,
}: TodaysPlanProps) {
  const {
    handleDeletePlanItem: contextDeletePlanItem,
    handleBatchDeletePlanItems: contextBatchDelete,
  } = useAppContext();

  const [internalSelectedPlanIds, setInternalSelectedPlanIds] = useState<Set<string>>(new Set());
  const selectedPlanIds = externalSelectedPlanIds || internalSelectedPlanIds;

  const validItems = plan.filter((p) => p.id);
  const isAllSelected =
    validItems.length > 0 &&
    validItems.every((item) => selectedPlanIds.has(item.id!));
  const isSomeSelected =
    validItems.some((item) => selectedPlanIds.has(item.id!)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    const validIds = validItems.map((item) => item.id!);
    if (onSelectAllPlanItems) {
      onSelectAllPlanItems(validIds, !isAllSelected);
    } else {
      if (isAllSelected) {
        setInternalSelectedPlanIds(new Set());
      } else {
        setInternalSelectedPlanIds(new Set(validIds));
      }
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    if (onSelectPlanItem) {
      onSelectPlanItem(id, selected);
    } else {
      setInternalSelectedPlanIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedPlanIds);
    if (ids.length === 0) return;
    if (onBatchDeletePlanItems) {
      onBatchDeletePlanItems(ids);
    } else if (contextBatchDelete) {
      contextBatchDelete(ids);
    }
    
    if (onClearSelection) {
      onClearSelection();
    } else {
      setInternalSelectedPlanIds(new Set());
    }
  };

  const handleDeleteSingle = (id: string) => {
    if (onSelectPlanItem) {
      onSelectPlanItem(id, false);
    } else {
      setInternalSelectedPlanIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    if (onDeletePlanItem) {
      onDeletePlanItem(id);
    } else if (contextDeletePlanItem) {
      contextDeletePlanItem(id);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 subtle-card-shadow transition-all duration-200">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          <h2 className="card-heading text-zinc-900 dark:text-zinc-100">Today&apos;s Schedule</h2>
        </div>
        <span className="label-small text-zinc-500 dark:text-zinc-400">Chronological</span>
      </div>

      {plan.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-1 pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={handleToggleSelectAll}
              className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>
              {isAllSelected ? "Deselect All" : `Select All (${validItems.length})`}
            </span>
          </label>

          {selectedPlanIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {selectedPlanIds.size} selected
              </span>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedPlanIds.size})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {plan.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 body-text">
          No scheduled blocks yet. Run a brain dump to build your day.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#EAEAEA] dark:before:bg-zinc-800">
          {plan.map((item, idx) => {
            const isSelected = item.id ? selectedPlanIds.has(item.id) : false;
            const isLinkedHovered = item.taskId && hoveredTaskId === item.taskId;

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative group"
                onMouseEnter={() => item.taskId && onHoverPlanItem && onHoverPlanItem(item.taskId)}
                onMouseLeave={() => item.taskId && onHoverPlanItem && onHoverPlanItem(null)}
              >
                <button
                  type="button"
                  onClick={() => onTogglePlanItem && item.id && onTogglePlanItem(item.id)}
                  title={item.completed ? "Mark as pending" : "Mark as completed"}
                  className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center bg-white dark:bg-zinc-950 z-10 active:scale-90 cursor-pointer ${
                    item.completed
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                      : "border-emerald-600 dark:border-emerald-500 group-hover:scale-110"
                  }`}
                >
                  {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>

                <div
                  className={`rounded-xl p-3 border transition-all duration-200 flex items-start justify-between gap-3 hover:-translate-y-0.5 ${
                    isSelected
                      ? "ring-2 ring-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500/40 shadow-xs"
                      : isLinkedHovered
                      ? "ring-2 ring-emerald-500/70 border-emerald-500 shadow-sm bg-emerald-50/30 dark:bg-emerald-950/30"
                      : item.completed
                      ? "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/70 opacity-65"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-950 shadow-xs"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {item.id && (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item.id!, !isSelected);
                        }}
                        title={isSelected ? "Deselect item" : "Select item"}
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all duration-150 active:scale-90 cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                            : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 opacity-60 group-hover:opacity-100"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                    )}

                    <div
                      onClick={() => onTogglePlanItem && item.id && onTogglePlanItem(item.id)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[12px] font-semibold text-emerald-600 dark:text-emerald-500 tracking-wider">
                          {item.time}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.taskId && (
                            <span
                              title="Linked to Today's Tasks"
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/50"
                            >
                              <LinkIcon className="w-2.5 h-2.5" />
                              Linked
                            </span>
                          )}
                          {item.completed && (
                            <span className="label-small text-emerald-600 font-medium">Done</span>
                          )}
                        </div>
                      </div>

                      <h4
                        className={`text-[14px] font-medium transition-all ${
                          item.completed
                            ? "line-through text-zinc-500 dark:text-zinc-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {item.task}
                      </h4>

                      {item.description && (
                        <p className="label-small text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingle(item.id!);
                      }}
                      title="Delete schedule block"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 active:scale-90 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

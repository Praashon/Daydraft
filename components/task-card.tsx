"use client";

import React from "react";
import { Task, Priority } from "@/types";
import { Check, Calendar, Tag, Trash2, GripVertical, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onTaskClick?: (task: Task) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  isLinkedHovered?: boolean;
  linkedPlanTime?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const PRIORITY_STYLES: Record<Priority, { label: string; badge: string }> = {
  high: {
    label: "High",
    badge: "bg-rose-50 text-rose-700 border-rose-200/60",
  },
  medium: {
    label: "Medium",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  },
  low: {
    label: "Low",
    badge: "bg-neutral-100 text-neutral-600 border-neutral-200/70",
  },
};

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onTaskClick,
  isDraggable,
  onDragStart,
  onDragEnd,
  isDragging,
  isSelected,
  onSelectChange,
  isLinkedHovered,
  linkedPlanTime,
  onMouseEnter,
  onMouseLeave,
}: TaskCardProps) {
  const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      draggable={isDraggable}
      {...(onDragStart
        ? {
            onDragStart: (e: any) => onDragStart(e, task),
          }
        : {})}
      {...(onDragEnd
        ? {
            onDragEnd: (e: any) => onDragEnd(e),
          }
        : {})}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
        isSelected
          ? "ring-2 ring-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-500/40 shadow-xs"
          : isLinkedHovered
            ? "ring-2 ring-emerald-500/70 border-emerald-500 shadow-sm bg-emerald-50/30 dark:bg-emerald-950/30"
            : task.completed
              ? "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 opacity-70"
              : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs"
      } ${
        isDragging
          ? "opacity-40 scale-[0.98] border-dashed border-emerald-600 dark:border-emerald-500 shadow-sm cursor-grabbing"
          : isDraggable
            ? "cursor-grab active:cursor-grabbing hover:border-emerald-600 dark:border-emerald-500/40 hover:shadow-xs"
            : ""
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {onSelectChange && (
          <button
            type="button"
            role="checkbox"
            draggable={false}
            aria-checked={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onSelectChange(!isSelected);
            }}
            title={isSelected ? "Deselect task" : "Select task"}
            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all duration-150 active:scale-90 ${
              isSelected
                ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 opacity-60 group-hover:opacity-100"
            }`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </button>
        )}

        {isDraggable && (
          <div
            title="Drag to change priority"
            className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:text-zinc-400 transition-colors shrink-0 -ml-1 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-zinc-50 dark:bg-zinc-900"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <button
          type="button"
          role="checkbox"
          draggable={false}
          aria-checked={task.completed}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all duration-200 active:scale-90 ${
            task.completed
              ? "bg-emerald-600 border-emerald-600 dark:border-emerald-500 text-white shadow-xs"
              : "bg-white dark:bg-zinc-950 border-[#D4D4D4] hover:border-emerald-600 dark:border-emerald-500 text-transparent"
          }`}
        >
          <motion.div
            initial={false}
            animate={{ scale: task.completed ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </motion.div>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={() =>
                onTaskClick ? onTaskClick(task) : onToggle(task.id)
              }
              className={`body-text font-medium cursor-pointer transition-all ${
                task.completed
                  ? "line-through text-zinc-500 dark:text-zinc-400"
                  : "text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:text-emerald-500"
              }`}
            >
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            {linkedPlanTime && (
              <span
                title="Linked to Today's Schedule"
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
              >
                <Clock className="w-3 h-3" />
                {linkedPlanTime}
              </span>
            )}
            {task.deadline && (
              <span className="inline-flex items-center gap-1 label-small text-zinc-500 dark:text-zinc-400">
                <Calendar className="w-3 h-3 text-zinc-500 dark:text-zinc-400/80" />
                {task.deadline}
              </span>
            )}
            {task.category && (
              <span className="inline-flex items-center gap-1 label-small text-zinc-500 dark:text-zinc-400">
                <Tag className="w-3 h-3 text-zinc-500 dark:text-zinc-400/80" />
                {task.category}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`label-small px-2.5 py-0.5 rounded-full border font-medium transition-all ${priorityInfo.badge}`}
        >
          {priorityInfo.label}
        </span>

        {onDelete && (
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Delete task"
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-90"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

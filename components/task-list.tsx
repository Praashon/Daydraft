"use client";

import React, { useState } from "react";
import { Task, Priority } from "@/types";
import { TaskCard } from "./task-card";
import { PrioritySelect } from "./priority-select";
import { Plus, CheckCheck, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { generateId } from "@/lib/utils";
import { useAppContext } from "./app-provider";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onBatchDeleteTasks?: (ids: string[]) => void;
  onTaskClick?: (task: Task) => void;
  selectedTaskIds?: Set<string>;
  onSelectTask?: (id: string, selected: boolean) => void;
  onSelectAllTasks?: (ids: string[], selected: boolean) => void;
  onClearSelection?: () => void;
}

type FilterType = "all" | "pending" | "completed";

export function TaskList({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onBatchDeleteTasks,
  onTaskClick,
  selectedTaskIds: externalSelectedTaskIds,
  onSelectTask,
  onSelectAllTasks,
  onClearSelection,
}: TaskListProps) {
  const { handleBatchDeleteTasks: contextBatchDelete } = useAppContext();
  const [filter, setFilter] = useState<FilterType>("all");
  const [internalSelectedTaskIds, setInternalSelectedTaskIds] = useState<Set<string>>(new Set());
  const selectedTaskIds = externalSelectedTaskIds || internalSelectedTaskIds;
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDeadline, setNewDeadline] = useState("");

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: generateId(),
      title: newTitle.trim(),
      priority: newPriority,
      deadline: newDeadline.trim() || undefined,
      category: "Personal",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onAddTask(newTask);
    setNewTitle("");
    setNewDeadline("");
    setIsAdding(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      const weight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    return a.completed ? 1 : -1;
  });

  const filteredTasks = sortedTasks.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const visibleTaskIds = filteredTasks.map((t) => t.id);
  const isAllSelected =
    visibleTaskIds.length > 0 &&
    visibleTaskIds.every((id) => selectedTaskIds.has(id));
  const isSomeSelected =
    visibleTaskIds.some((id) => selectedTaskIds.has(id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (onSelectAllTasks) {
      onSelectAllTasks(visibleTaskIds, !isAllSelected);
    } else {
      if (isAllSelected) {
        setInternalSelectedTaskIds(new Set());
      } else {
        setInternalSelectedTaskIds(new Set(visibleTaskIds));
      }
    }
  };

  const handleSelectTask = (id: string, selected: boolean) => {
    if (onSelectTask) {
      onSelectTask(id, selected);
    } else {
      setInternalSelectedTaskIds((prev) => {
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
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    if (onBatchDeleteTasks) {
      onBatchDeleteTasks(ids);
    } else if (contextBatchDelete) {
      contextBatchDelete(ids);
    }
    
    if (onClearSelection) {
      onClearSelection();
    } else {
      setInternalSelectedTaskIds(new Set());
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 subtle-card-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <h2 className="card-heading text-zinc-900 dark:text-zinc-100">Today&apos;s Tasks</h2>
          <span className="label-small text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/70 self-start sm:self-auto">
          {(["all", "pending", "completed"] as FilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg label-small capitalize transition-all ${
                filter === tab
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-1 pb-3 mb-2 border-b border-zinc-100 dark:border-zinc-800/50">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeSelected;
              }}
              onChange={handleToggleSelectAll}
              className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>
              {isAllSelected ? "Deselect All" : `Select All (${filteredTasks.length})`}
            </span>
          </label>

          {selectedTaskIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {selectedTaskIds.size} selected
              </span>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedTaskIds.size})</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5 min-h-[140px]">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onDelete={(id) => {
                  if (onSelectTask) {
                    onSelectTask(id, false);
                  } else {
                    setInternalSelectedTaskIds((prev) => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                  }
                  onDeleteTask(id);
                }}
                onTaskClick={onTaskClick}
                isSelected={selectedTaskIds.has(task.id)}
                onSelectChange={(selected) => handleSelectTask(task.id, selected)}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-2 border border-zinc-200 dark:border-zinc-800">
                <CheckCheck className="w-5 h-5" />
              </div>
              <p className="body-text text-zinc-500 dark:text-zinc-400 font-medium">
                {filter === "completed"
                  ? "No completed tasks yet."
                  : filter === "pending"
                  ? "All caught up! No pending tasks."
                  : "No tasks here yet. Try a brain dump above!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/60">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:text-emerald-500 transition-colors py-1 px-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900"
          >
            <Plus className="w-4 h-4" />
            Add a quick task
          </button>
        ) : (
          <form onSubmit={handleQuickAdd} className="space-y-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 body-text text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:border-emerald-600 dark:border-emerald-500"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <PrioritySelect
                  value={newPriority}
                  onChange={setNewPriority}
                  variant="white"
                />

                <input
                  type="text"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  placeholder="Optional deadline (e.g., 5 PM)"
                  className="px-2.5 py-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 label-small text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 label-small text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white label-small font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Add Task
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Task, Priority } from "@/types";
import { TaskCard } from "./task-card";
import { PrioritySelect } from "./priority-select";
import { Search, Plus, ArrowUpDown, MoveDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateId } from "@/lib/utils";

interface TasksViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTaskPriority?: (id: string, priority: Priority) => void;
}

export function TasksView({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateTaskPriority,
}: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState("Work");

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropPriority, setActiveDropPriority] = useState<Priority | null>(null);

  const categories = ["all", ...Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const highTasks = filteredTasks.filter((t) => t.priority === "high");
  const mediumTasks = filteredTasks.filter((t) => t.priority === "medium");
  const lowTasks = filteredTasks.filter((t) => t.priority === "low");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      id: generateId(),
      title: newTitle.trim(),
      priority: newPriority,
      category: newCategory,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    setNewTitle("");
    setIsAdding(false);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setActiveDropPriority(null);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, priority: Priority) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDropPriority !== priority) {
      setActiveDropPriority(priority);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent<HTMLDivElement>, priority: Priority) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (activeDropPriority === priority) {
        setActiveDropPriority(null);
      }
    }
  };

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, priority: Priority) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId && onUpdateTaskPriority) {
      onUpdateTaskPriority(taskId, priority);
    }
    setDraggedTaskId(null);
    setActiveDropPriority(null);
  };

  const COLUMN_CONFIG: {
    priority: Priority;
    title: string;
    dotColor: string;
    textColor: string;
    tasks: Task[];
    emptyText: string;
    dropHintText: string;
    activeBorder: string;
    activeBg: string;
    dropAreaBorder: string;
  }[] = [
    {
      priority: "high",
      title: "High Priority",
      dotColor: "bg-rose-500",
      textColor: "text-rose-700",
      tasks: highTasks,
      emptyText: "No high priority tasks",
      dropHintText: "Drop here to make High Priority",
      activeBorder: "border-rose-300 ring-2 ring-rose-400/40",
      activeBg: "bg-rose-50/30",
      dropAreaBorder: "border-rose-300 bg-rose-50/60 text-rose-700",
    },
    {
      priority: "medium",
      title: "Medium Priority",
      dotColor: "bg-indigo-500",
      textColor: "text-indigo-700",
      tasks: mediumTasks,
      emptyText: "No medium priority tasks",
      dropHintText: "Drop here to make Medium Priority",
      activeBorder: "border-indigo-300 ring-2 ring-indigo-400/40",
      activeBg: "bg-indigo-50/30",
      dropAreaBorder: "border-indigo-300 bg-indigo-50/60 text-indigo-700",
    },
    {
      priority: "low",
      title: "Low Priority",
      dotColor: "bg-neutral-400",
      textColor: "text-neutral-700",
      tasks: lowTasks,
      emptyText: "No low priority tasks",
      dropHintText: "Drop here to make Low Priority",
      activeBorder: "border-neutral-300 ring-2 ring-neutral-400/40",
      activeBg: "bg-neutral-100/40",
      dropAreaBorder: "border-neutral-300 bg-neutral-100/70 text-neutral-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="page-heading text-zinc-900 dark:text-zinc-100">My Tasks</h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 label-small font-medium">
              <ArrowUpDown className="w-3 h-3" />
              Drag & Drop Enabled
            </span>
          </div>
          <p className="body-text text-zinc-500 dark:text-zinc-400 mt-0.5">
            Organize tasks across priorities. Drag and drop any card between columns to change its priority instantly.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white label-small font-medium transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all tasks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 body-text text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat as string}
              onClick={() => setSelectedCategory(cat as string)}
              className={`px-3 py-2 rounded-xl label-small capitalize whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white border-[#171717] font-medium"
                  : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-[#D4D4D4]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreate}
            className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-emerald-600 dark:border-emerald-500/30 shadow-md space-y-3"
          >
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 body-text text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:border-emerald-500"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <PrioritySelect
                  value={newPriority}
                  onChange={setNewPriority}
                  variant="canvas"
                />
                <input
                  type="text"
                  list="task-category-options"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category (e.g. Work)"
                  className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:text-zinc-400 focus:outline-none focus:border-emerald-600 dark:border-emerald-500 focus:ring-2 focus:ring-[#059669]/15 transition-all"
                />
                <datalist id="task-category-options">
                  {categories
                    .filter((c) => c !== "all")
                    .map((cat) => (
                      <option key={cat as string} value={cat as string} />
                    ))}
                </datalist>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 label-small text-zinc-500 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white label-small font-medium hover:bg-emerald-700"
                >
                  Save Task
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMN_CONFIG.map((col) => {
          const isTargeted = activeDropPriority === col.priority;
          const isDraggingActive = draggedTaskId !== null;

          return (
            <div
              key={col.priority}
              onDragOver={(e) => handleColumnDragOver(e, col.priority)}
              onDragLeave={(e) => handleColumnDragLeave(e, col.priority)}
              onDrop={(e) => handleColumnDrop(e, col.priority)}
              className={`space-y-3 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 min-h-[360px] flex flex-col ${
                isTargeted
                  ? `${col.activeBorder} ${col.activeBg}`
                  : isDraggingActive
                  ? "border-dashed border-[#D4D4D4] bg-zinc-50 dark:bg-zinc-900/60"
                  : "border-transparent bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className={`label-small font-semibold ${col.textColor} flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  {col.title} ({col.tasks.length})
                </span>
                {isTargeted && (
                  <span className="inline-flex items-center gap-1 label-small text-xs font-medium animate-pulse">
                    <MoveDown className="w-3 h-3" />
                    Drop here
                  </span>
                )}
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <AnimatePresence>
                  {col.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      isDraggable={true}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedTaskId === task.id}
                    />
                  ))}
                </AnimatePresence>

                {col.tasks.length === 0 && (
                  <div
                    className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed text-center transition-all ${
                      isTargeted
                        ? col.dropAreaBorder
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <p className="label-small font-medium">
                      {isTargeted ? col.dropHintText : col.emptyText}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                      {isTargeted ? "Release mouse to assign" : "Drag tasks here to set priority"}
                    </p>
                  </div>
                )}

                {isTargeted && col.tasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-3 rounded-xl border-2 border-dashed text-center label-small font-medium ${col.dropAreaBorder}`}
                  >
                    {col.dropHintText}
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

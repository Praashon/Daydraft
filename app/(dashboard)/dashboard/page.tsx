"use client";

import React, { useState } from "react";
import { BrainDump } from "@/components/brain-dump";
import { ProcessingState } from "@/components/processing-state";
import { FocusCard } from "@/components/focus-card";
import { TaskList } from "@/components/task-list";
import { TodaysPlan } from "@/components/todays-plan";
import { AIInsight } from "@/components/ai-insight";
import { StatsCard } from "@/components/stats-card";
import { NotesList } from "@/components/notes-list";
import { CoachingSidebar } from "@/components/coaching-sidebar";
import { AIOrganizeResponse, Task } from "@/types";
import { useAppContext } from "@/components/app-provider";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Link as LinkIcon, Unlink } from "lucide-react";

export default function DashboardPage() {
  const {
    user,
    tasks,
    setTasks,
    focusTask,
    setFocusTask,
    dailyPlan,
    setDailyPlan,
    insight,
    setInsight,
    notes,
    setNotes,
    handleToggleTask,
    handleAddTask,
    handleDeleteTask,
    handleBatchDeleteTasks,
    handleTogglePlanItem,
    handleDeletePlanItem,
    handleBatchDeletePlanItems,
  } = useAppContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isInsightDismissed, setIsInsightDismissed] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isLinked, setIsLinked] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(
    new Set(),
  );

  const onSelectTask = (id: string, selected: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });

    if (isLinked) {
      const planItem = dailyPlan.find((p) => p.taskId === id);
      if (planItem && planItem.id) {
        setSelectedPlanIds((prev) => {
          const next = new Set(prev);
          if (selected) next.add(planItem.id!);
          else next.delete(planItem.id!);
          return next;
        });
      }
    }
  };

  const onSelectAllTasks = (ids: string[], selected: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
      return next;
    });

    if (isLinked) {
      const planIds = ids
        .map((id) => dailyPlan.find((p) => p.taskId === id)?.id)
        .filter(Boolean) as string[];
      setSelectedPlanIds((prev) => {
        const next = new Set(prev);
        planIds.forEach((id) => (selected ? next.add(id) : next.delete(id)));
        return next;
      });
    }
  };

  const onSelectPlanItem = (id: string, selected: boolean) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });

    if (isLinked) {
      const planItem = dailyPlan.find((p) => p.id === id);
      const taskId = planItem?.taskId;
      if (taskId) {
        setSelectedTaskIds((prev) => {
          const next = new Set(prev);
          if (selected) next.add(taskId);
          else next.delete(taskId);
          return next;
        });
      }
    }
  };

  const onSelectAllPlanItems = (ids: string[], selected: boolean) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
      return next;
    });

    if (isLinked) {
      const tIds = ids
        .map((id) => dailyPlan.find((p) => p.id === id)?.taskId)
        .filter(Boolean) as string[];
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        tIds.forEach((id) => (selected ? next.add(id) : next.delete(id)));
        return next;
      });
    }
  };

  const onBatchDeleteTasksLinked = (ids: string[]) => {
    handleBatchDeleteTasks(ids);
    if (isLinked) {
      const planIdsToDelete = Array.from(selectedPlanIds);
      if (planIdsToDelete.length > 0) {
        handleBatchDeletePlanItems(planIdsToDelete);
        setSelectedPlanIds(new Set());
      }
    }
  };

  const onBatchDeletePlanItemsLinked = (ids: string[]) => {
    handleBatchDeletePlanItems(ids);
    if (isLinked) {
      const taskIdsToDelete = Array.from(selectedTaskIds);
      if (taskIdsToDelete.length > 0) {
        handleBatchDeleteTasks(taskIdsToDelete);
        setSelectedTaskIds(new Set());
      }
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const stats = {
    total: tasks.length,
    completed: completedCount,
    remaining: tasks.length - completedCount,
  };

  const handleOrganizeThoughts = async (
    text: string,
    overrideProvider?: "openrouter" | "gemini",
  ) => {
    setIsProcessing(true);
    const activeProvider = overrideProvider || user.aiProvider || "openrouter";
    const model =
      activeProvider === "openrouter" ? user.selectedModel : "gemini-2.5-flash";

    try {
      const response = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          provider: activeProvider,
          model,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process thoughts");
      }

      const data: AIOrganizeResponse = await response.json();

      setTimeout(() => {
        if (data.tasks && data.tasks.length > 0) {
          setTasks(data.tasks);
        }
        if (data.focusTask) {
          setFocusTask(data.focusTask);
        }
        if (data.dailyPlan && data.dailyPlan.length > 0) {
          setDailyPlan(data.dailyPlan);
        }
        if (data.insight) {
          setInsight(data.insight);
          setIsInsightDismissed(false);
        }
        if (data.notes && data.notes.length > 0) {
          const newNotes = data.notes.map((n) => ({
            ...n,
            dismissedFromDashboard: false,
          }));
          setNotes((prev) => [...prev, ...newNotes]);
        }
        setIsProcessing(false);
      }, 2600);
    } catch (err) {
      console.error("Error organizing brain dump:", err);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-8"
      >
        <section aria-label="Brain Dump Section">
          <BrainDump
            onOrganize={handleOrganizeThoughts}
            isLoading={isProcessing}
          />
        </section>

        <AnimatePresence>
          {isProcessing && (
            <section aria-label="AI Processing State">
              <ProcessingState />
            </section>
          )}
        </AnimatePresence>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FocusCard
              focusTask={focusTask}
              onComplete={() => {
                const target = tasks.find(
                  (t) =>
                    t.id === focusTask.taskId ||
                    t.title
                      .toLowerCase()
                      .includes(focusTask.title.toLowerCase()),
                );
                if (target) {
                  handleToggleTask(target.id);
                }
              }}
            />
          </div>

          <div className="lg:col-span-1">
            <StatsCard stats={stats} />
          </div>
        </section>

        {insight && (
          <section aria-label="AI Daily Insight">
            <AnimatePresence mode="wait">
              {!isInsightDismissed ? (
                <motion.div
                  key="insight-expanded"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                >
                  <AIInsight
                    insight={insight}
                    onClose={() => setIsInsightDismissed(true)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="insight-minimized"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex justify-end"
                >
                  <button
                    type="button"
                    onClick={() => setIsInsightDismissed(false)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-medium transition-all shadow-xs group"
                    title="View Daily Intelligence"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 group-hover:rotate-12 transition-transform" />
                    <span>Show Daily Intelligence</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {notes && notes.filter((n) => !n.dismissedFromDashboard).length > 0 && (
          <section aria-label="Extracted Notes">
            <NotesList
              notes={notes.filter((n) => !n.dismissedFromDashboard)}
              onClose={() => {
                setNotes((prev) =>
                  prev.map((n) => ({ ...n, dismissedFromDashboard: true })),
                );
              }}
            />
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6 relative">
            <TaskList
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onBatchDeleteTasks={onBatchDeleteTasksLinked}
              onTaskClick={setSelectedTask}
              selectedTaskIds={selectedTaskIds}
              onSelectTask={onSelectTask}
              onSelectAllTasks={onSelectAllTasks}
              onClearSelection={() => setSelectedTaskIds(new Set())}
            />

            <div className="hidden lg:flex absolute left-[calc(100%+1rem)] top-[40%] -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center">
              <button
                onClick={() => setIsLinked(!isLinked)}
                className={`p-1.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isLinked
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 shadow-emerald-500/10"
                    : "bg-white/90 border-zinc-200/80 text-zinc-400 hover:text-zinc-600 dark:bg-zinc-900/90 dark:border-zinc-800/80 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
                title={isLinked ? "Unlink selection" : "Link selection"}
              >
                {isLinked ? (
                  <LinkIcon className="w-3.5 h-3.5" />
                ) : (
                  <Unlink className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex lg:hidden justify-center -my-5 relative z-10">
            <button
              onClick={() => setIsLinked(!isLinked)}
              className={`p-1.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
                isLinked
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 shadow-emerald-500/10"
                  : "bg-white/90 border-zinc-200/80 text-zinc-400 hover:text-zinc-600 dark:bg-zinc-900/90 dark:border-zinc-800/80 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
              title={isLinked ? "Unlink selection" : "Link selection"}
            >
              {isLinked ? (
                <LinkIcon className="w-3.5 h-3.5" />
              ) : (
                <Unlink className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <TodaysPlan
              plan={dailyPlan}
              onTogglePlanItem={handleTogglePlanItem}
              onDeletePlanItem={handleDeletePlanItem}
              onBatchDeletePlanItems={onBatchDeletePlanItemsLinked}
              selectedPlanIds={selectedPlanIds}
              onSelectPlanItem={onSelectPlanItem}
              onSelectAllPlanItems={onSelectAllPlanItems}
              onClearSelection={() => setSelectedPlanIds(new Set())}
            />
          </div>
        </section>
      </motion.div>

      <CoachingSidebar
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}

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
import { AIOrganizeResponse, Task, DailyPlanItem } from "@/types";
import { useAppContext } from "@/components/app-provider";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Link as LinkIcon, Unlink, Sparkles } from "lucide-react";

function getMatchingPlanItems(
  task: Task,
  allPlanItems: DailyPlanItem[],
  allTasks: Task[],
): DailyPlanItem[] {
  const byTaskId = allPlanItems.filter((p) => p.taskId === task.id);
  if (byTaskId.length > 0) return byTaskId;

  const taskTitleLower = task.title.trim().toLowerCase();
  const byExactTitle = allPlanItems.filter(
    (p) => p.task.trim().toLowerCase() === taskTitleLower,
  );
  if (byExactTitle.length > 0) return byExactTitle;

  const bySubstring = allPlanItems.filter(
    (p) =>
      p.task.toLowerCase().includes(taskTitleLower) ||
      taskTitleLower.includes(p.task.toLowerCase()),
  );
  if (bySubstring.length > 0) return bySubstring;

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "into",
    "that",
    "this",
    "task",
    "project",
    "setup",
    "define",
  ]);
  const taskWords = taskTitleLower
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (taskWords.length > 0) {
    const byKeywords = allPlanItems.filter((p) => {
      const planText = (p.task + " " + (p.description || "")).toLowerCase();
      return taskWords.some((word) => planText.includes(word));
    });
    if (byKeywords.length > 0) return byKeywords;
  }

  if (allTasks.length === 1) {
    return allPlanItems;
  }

  return [];
}

function getMatchingTaskForPlan(
  planItem: DailyPlanItem,
  allTasks: Task[],
): Task | undefined {
  if (planItem.taskId) {
    const found = allTasks.find((t) => t.id === planItem.taskId);
    if (found) return found;
  }

  const planTitleLower = planItem.task.trim().toLowerCase();
  const exact = allTasks.find(
    (t) => t.title.trim().toLowerCase() === planTitleLower,
  );
  if (exact) return exact;

  const substring = allTasks.find(
    (t) =>
      t.title.toLowerCase().includes(planTitleLower) ||
      planTitleLower.includes(t.title.toLowerCase()),
  );
  if (substring) return substring;

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "into",
    "that",
    "this",
    "task",
    "project",
    "setup",
    "define",
  ]);
  const planWords = (planItem.task + " " + (planItem.description || ""))
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (planWords.length > 0) {
    const byKeyword = allTasks.find((t) => {
      const taskText = t.title.toLowerCase();
      return planWords.some((word) => taskText.includes(word));
    });
    if (byKeyword) return byKeyword;
  }

  if (allTasks.length === 1) {
    return allTasks[0];
  }

  return undefined;
}

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
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [isInsightDismissed, setIsInsightDismissed] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [isLinked, setIsLinked] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("daydraft_is_linked") !== "false";
    }
    return true;
  });
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredPlanTaskId, setHoveredPlanTaskId] = useState<string | null>(null);

  const toggleLinked = () => {
    setIsLinked((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("daydraft_is_linked", String(next));
      }
      return next;
    });
  };

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(
    new Set(),
  );

  const triggerAIAutoUpdate = async (
    currentTasks: Task[],
    currentPlan: DailyPlanItem[],
  ) => {
    setIsAutoUpdating(true);
    try {
      const activeProvider = user.aiProvider || "openrouter";
      const model =
        activeProvider === "openrouter" ? user.selectedModel : "gemini-2.5-flash";

      const res = await fetch("/api/organize/auto-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: currentTasks,
          dailyPlan: currentPlan,
          provider: activeProvider,
          model,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.focusTask) setFocusTask(data.focusTask);
        if (data.dailyPlan && data.dailyPlan.length > 0) setDailyPlan(data.dailyPlan);
        if (data.insight) setInsight(data.insight);
      }
    } catch (e) {
      console.warn("AI Auto-update failed:", e);
    } finally {
      setIsAutoUpdating(false);
    }
  };

  const handleManualRebalance = () => {
    triggerAIAutoUpdate(tasks, dailyPlan);
  };

  const prevTasksCountRef = React.useRef(tasks.length);
  const prevPlanCountRef = React.useRef(dailyPlan.length);

  React.useEffect(() => {
    const prevTasks = prevTasksCountRef.current;
    const prevPlans = prevPlanCountRef.current;
    prevTasksCountRef.current = tasks.length;
    prevPlanCountRef.current = dailyPlan.length;

    if (isLinked && (tasks.length < prevTasks || dailyPlan.length < prevPlans)) {
      triggerAIAutoUpdate(tasks, dailyPlan);
    }
  }, [tasks, dailyPlan, isLinked]);

  const planTimesByTaskId = React.useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      const matches = getMatchingPlanItems(t, dailyPlan, tasks);
      if (matches.length > 0 && matches[0].time) {
        map.set(t.id, matches[0].time);
      }
    });
    return map;
  }, [dailyPlan, tasks]);

  const onToggleTaskLinked = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const targetCompleted = task ? !task.completed : true;
    handleToggleTask(id);

    let nextTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: targetCompleted } : t,
    );
    let nextPlan = dailyPlan;

    if (isLinked && task) {
      const matchingPlans = getMatchingPlanItems(task, dailyPlan, tasks);
      if (matchingPlans.length > 0) {
        const matchingPlanIds = new Set(
          matchingPlans.map((p) => p.id).filter(Boolean),
        );
        nextPlan = dailyPlan.map((p) => {
          if (p.id && matchingPlanIds.has(p.id)) {
            if (p.completed !== targetCompleted) {
              handleTogglePlanItem(p.id);
            }
            return { ...p, completed: targetCompleted };
          }
          return p;
        });
      }
    }

    if (isLinked) {
      triggerAIAutoUpdate(nextTasks, nextPlan);
    }
  };

  const onTogglePlanItemLinked = (id: string) => {
    const planItem = dailyPlan.find((p) => p.id === id);
    const targetCompleted = planItem ? !planItem.completed : true;
    handleTogglePlanItem(id);

    let nextPlan = dailyPlan.map((p) =>
      p.id === id ? { ...p, completed: targetCompleted } : p,
    );
    let nextTasks = tasks;

    if (isLinked && planItem) {
      const parentTask = getMatchingTaskForPlan(planItem, tasks);
      if (parentTask) {
        const allPlansForTask = getMatchingPlanItems(parentTask, nextPlan, tasks);
        const allCompleted =
          allPlansForTask.length > 0 && allPlansForTask.every((p) => p.completed);

        if (targetCompleted && allCompleted && !parentTask.completed) {
          handleToggleTask(parentTask.id);
          nextTasks = tasks.map((t) =>
            t.id === parentTask.id ? { ...t, completed: true } : t,
          );
        } else if (!targetCompleted && parentTask.completed) {
          handleToggleTask(parentTask.id);
          nextTasks = tasks.map((t) =>
            t.id === parentTask.id ? { ...t, completed: false } : t,
          );
        }
      }
    }

    if (isLinked) {
      triggerAIAutoUpdate(nextTasks, nextPlan);
    }
  };

  const onSelectTask = (id: string, selected: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });

    if (isLinked) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        const planItems = getMatchingPlanItems(task, dailyPlan, tasks);
        if (planItems.length > 0) {
          setSelectedPlanIds((prev) => {
            const next = new Set(prev);
            planItems.forEach((p) => {
              if (p.id) {
                if (selected) next.add(p.id);
                else next.delete(p.id);
              }
            });
            return next;
          });
        }
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
      const allValidPlanIds = dailyPlan
        .map((p) => p.id)
        .filter(Boolean) as string[];
      setSelectedPlanIds((prev) => {
        const next = new Set(prev);
        allValidPlanIds.forEach((id) =>
          selected ? next.add(id) : next.delete(id),
        );
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
      if (planItem) {
        const matchingTask = getMatchingTaskForPlan(planItem, tasks);
        if (matchingTask) {
          setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            if (selected) next.add(matchingTask.id);
            else next.delete(matchingTask.id);
            return next;
          });
        }
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
      const allTaskIds = tasks.map((t) => t.id);
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        allTaskIds.forEach((id) =>
          selected ? next.add(id) : next.delete(id),
        );
        return next;
      });
    }
  };

  const onDeleteTaskLinked = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const linkedPlans = isLinked ? getMatchingPlanItems(task, dailyPlan, tasks) : [];
    handleDeleteTask(id, linkedPlans);
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (isLinked && linkedPlans.length > 0) {
      setSelectedPlanIds((prev) => {
        const next = new Set(prev);
        linkedPlans.forEach((p) => {
          if (p.id) next.delete(p.id);
        });
        return next;
      });
    }
  };

  const onDeletePlanItemLinked = (id: string) => {
    const planItem = dailyPlan.find((p) => p.id === id);
    if (!planItem) return;
    const linkedTask = isLinked ? getMatchingTaskForPlan(planItem, tasks) : undefined;
    handleDeletePlanItem(id, linkedTask ? [linkedTask] : []);
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (isLinked && linkedTask) {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(linkedTask.id);
        return next;
      });
    }
  };

  const onBatchDeleteTasksLinked = (ids: string[]) => {
    const selectedTasks = tasks.filter((t) => ids.includes(t.id));
    let linkedPlans: DailyPlanItem[] = [];

    if (isLinked) {
      if (ids.length >= tasks.length && tasks.length > 0) {
        linkedPlans = dailyPlan;
      } else {
        const planSet = new Set<string>();
        selectedTasks.forEach((t) => {
          getMatchingPlanItems(t, dailyPlan, tasks).forEach((p) => {
            if (p.id) planSet.add(p.id);
          });
        });
        selectedPlanIds.forEach((pId) => planSet.add(pId));
        linkedPlans = dailyPlan.filter((p) => p.id && planSet.has(p.id));
      }
    }

    handleBatchDeleteTasks(ids, linkedPlans);
    setSelectedTaskIds(new Set());
    setSelectedPlanIds(new Set());
  };

  const onBatchDeletePlanItemsLinked = (ids: string[]) => {
    const selectedPlans = dailyPlan.filter((p) => p.id && ids.includes(p.id));
    let linkedTasks: Task[] = [];

    if (isLinked) {
      if (ids.length >= dailyPlan.length && dailyPlan.length > 0) {
        linkedTasks = tasks;
      } else {
        const taskSet = new Set<string>();
        selectedPlans.forEach((p) => {
          const matched = getMatchingTaskForPlan(p, tasks);
          if (matched) taskSet.add(matched.id);
        });
        selectedTaskIds.forEach((tId) => taskSet.add(tId));
        linkedTasks = tasks.filter((t) => taskSet.has(t.id));
      }
    }

    handleBatchDeletePlanItems(ids, linkedTasks);
    setSelectedPlanIds(new Set());
    setSelectedTaskIds(new Set());
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
                  onToggleTaskLinked(target.id);
                }
              }}
            />
          </div>

          <div className="lg:col-span-1">
            <StatsCard stats={stats} />
          </div>
        </section>

        <AnimatePresence>
          {isAutoUpdating && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                <span>AI auto-updating schedule &amp; priorities...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-medium transition-all shadow-xs group cursor-pointer"
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
              onToggleTask={onToggleTaskLinked}
              onAddTask={handleAddTask}
              onDeleteTask={onDeleteTaskLinked}
              onBatchDeleteTasks={onBatchDeleteTasksLinked}
              onTaskClick={setSelectedTask}
              selectedTaskIds={selectedTaskIds}
              onSelectTask={onSelectTask}
              onSelectAllTasks={onSelectAllTasks}
              onClearSelection={() => setSelectedTaskIds(new Set())}
              hoveredPlanTaskId={hoveredPlanTaskId}
              onHoverTask={setHoveredTaskId}
              planTimesByTaskId={planTimesByTaskId}
            />

            <div className="hidden lg:flex absolute left-[calc(100%+1rem)] top-[40%] -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center gap-2">
              <button
                type="button"
                onClick={toggleLinked}
                className={`p-2 rounded-full border shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer group ${
                  isLinked
                    ? "bg-emerald-50 border-emerald-500/40 text-emerald-600 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                    : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
                title={
                  isLinked
                    ? "Tasks and Schedule are linked (Click to unlink)"
                    : "Tasks and Schedule are unlinked (Click to link)"
                }
              >
                {isLinked ? (
                  <LinkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-45 transition-transform" />
                ) : (
                  <Unlink className="w-4 h-4 text-zinc-400 group-hover:rotate-45 transition-transform" />
                )}
              </button>

              {isLinked && (
                <button
                  type="button"
                  onClick={handleManualRebalance}
                  disabled={isAutoUpdating}
                  className="p-1.5 rounded-full border shadow-xs backdrop-blur-md bg-white hover:bg-emerald-50 border-zinc-200 hover:border-emerald-300 text-zinc-500 hover:text-emerald-600 dark:bg-zinc-900 dark:hover:bg-emerald-950/40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-emerald-400 transition-all hover:scale-110 active:scale-90 cursor-pointer"
                  title="Auto-update &amp; rebalance schedule with AI"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      isAutoUpdating ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="flex lg:hidden justify-center -my-5 relative z-10 items-center gap-2">
            <button
              type="button"
              onClick={toggleLinked}
              className={`px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                isLinked
                  ? "bg-emerald-50 border-emerald-500/40 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
              }`}
              title={
                isLinked
                  ? "Tasks and Schedule are linked (Click to unlink)"
                  : "Tasks and Schedule are unlinked (Click to link)"
              }
            >
              {isLinked ? (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Linked</span>
                </>
              ) : (
                <>
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlinked</span>
                </>
              )}
            </button>

            {isLinked && (
              <button
                type="button"
                onClick={handleManualRebalance}
                disabled={isAutoUpdating}
                className="px-2.5 py-1.5 rounded-full border shadow-sm backdrop-blur-md bg-white hover:bg-emerald-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 flex items-center gap-1 text-xs font-medium cursor-pointer"
                title="Auto-update schedule with AI"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${
                    isAutoUpdating ? "animate-spin" : ""
                  }`}
                />
                <span>Auto-update</span>
              </button>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <TodaysPlan
              plan={dailyPlan}
              onTogglePlanItem={onTogglePlanItemLinked}
              onDeletePlanItem={onDeletePlanItemLinked}
              onBatchDeletePlanItems={onBatchDeletePlanItemsLinked}
              selectedPlanIds={selectedPlanIds}
              onSelectPlanItem={onSelectPlanItem}
              onSelectAllPlanItems={onSelectAllPlanItems}
              onClearSelection={() => setSelectedPlanIds(new Set())}
              hoveredTaskId={hoveredTaskId}
              onHoverPlanItem={setHoveredPlanTaskId}
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

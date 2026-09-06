"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import {
  Task,
  FocusTask,
  DailyPlanItem,
  UserProfile,
  Note,
  TrashItem,
} from "@/types";
import {
  DEFAULT_USER,
  INITIAL_TASKS,
  INITIAL_FOCUS_TASK,
  INITIAL_DAILY_PLAN,
  INITIAL_INSIGHT,
} from "@/lib/sample-data";
import confetti from "canvas-confetti";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEYS = {
  TASKS: "daydraft_tasks_v1",
  FOCUS: "daydraft_focus_v1",
  PLAN: "daydraft_plan_v1",
  INSIGHT: "daydraft_insight_v1",
  USER: "daydraft_user_v1",
  NOTES: "daydraft_notes_v1",
  TRASH: "daydraft_trash_v1",
};

const normalizeStoredText = (value: unknown) =>
  typeof value === "string" ? value.replace(/\u2014/g, " - ") : value;

interface AppContextType {
  isHydrated: boolean;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  focusTask: FocusTask;
  setFocusTask: React.Dispatch<React.SetStateAction<FocusTask>>;
  dailyPlan: DailyPlanItem[];
  setDailyPlan: React.Dispatch<React.SetStateAction<DailyPlanItem[]>>;
  insight: string;
  setInsight: React.Dispatch<React.SetStateAction<string>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  trash: TrashItem[];
  setTrash: React.Dispatch<React.SetStateAction<TrashItem[]>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleTask: (id: string) => void;
  handleAddTask: (newTask: Task) => void;
  handleDeleteTask: (id: string) => void;
  handleBatchDeleteTasks: (ids: string[]) => void;
  handleUpdateTaskPriority: (id: string, newPriority: any) => void;
  handleTogglePlanItem: (id: string) => void;
  handleAddPlanItem: (item: DailyPlanItem) => void;
  handleDeletePlanItem: (id: string) => void;
  handleBatchDeletePlanItems: (ids: string[]) => void;
  handleDeleteNote: (id: string) => void;
  handleBatchDeleteNotes: (ids: string[]) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDeleteFromTrash: (id: string) => void;
  handleResetData: () => void;
  deleteModalOpen: boolean;
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskToDelete: Task | null;
  setTaskToDelete: React.Dispatch<React.SetStateAction<Task | null>>;
  confirmDeleteDashboardOnly: () => void;
  confirmDeleteEverywhere: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [tasksState, setTasksState] = useState<Task[]>(INITIAL_TASKS);
  const [focusTaskState, setFocusTaskState] =
    useState<FocusTask>(INITIAL_FOCUS_TASK);
  const [dailyPlanState, setDailyPlanState] =
    useState<DailyPlanItem[]>(INITIAL_DAILY_PLAN);
  const [insightState, setInsightState] = useState<string>(INITIAL_INSIGHT);
  const [notesState, setNotesState] = useState<Note[]>([]);
  const [userState, setUserState] = useState<UserProfile>(DEFAULT_USER);
  const [trashState, setTrashState] = useState<TrashItem[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetTasks, setDeleteTargetTasks] = useState<Task[]>([]);
  const [deleteTargetPlanItems, setDeleteTargetPlanItems] = useState<
    DailyPlanItem[]
  >([]);
  const taskToDelete = deleteTargetTasks[0] || null;

  const supabase = createClient();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const setTasks = useCallback(
    (action: React.SetStateAction<Task[]>) => {
      setTasksState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        if (isDataLoaded) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            const nextMap = new Map(next.map((t: Task) => [t.id, t]));
            const prevMap = new Map(prev.map((t: Task) => [t.id, t]));

            const toUpsert = next
              .filter(
                (t: Task) =>
                  JSON.stringify(t) !== JSON.stringify(prevMap.get(t.id)),
              )
              .map((t: Task) => ({
                id: t.id,
                user_id: user.id,
                title: t.title,
                priority: t.priority,
                deadline: t.deadline || null,
                category: t.category || null,
                completed: t.completed,
                created_at: t.createdAt || null,
              }));
            const toDelete = prev
              .filter((t: Task) => !nextMap.has(t.id))
              .map((t: Task) => t.id);

            if (toUpsert.length > 0)
              supabase.from("tasks").upsert(toUpsert).then();
            if (toDelete.length > 0)
              supabase.from("tasks").delete().in("id", toDelete).then();
          });
        }
        return next;
      });
    },
    [isDataLoaded, supabase],
  );

  const setDailyPlan = useCallback(
    (action: React.SetStateAction<DailyPlanItem[]>) => {
      setDailyPlanState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        if (isDataLoaded) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            const nextMap = new Map(next.map((p: DailyPlanItem) => [p.id, p]));
            const prevMap = new Map(prev.map((p: DailyPlanItem) => [p.id, p]));

            const toUpsert = next
              .filter(
                (p: DailyPlanItem) =>
                  p.id &&
                  JSON.stringify(p) !== JSON.stringify(prevMap.get(p.id)),
              )
              .map((p: DailyPlanItem) => ({
                id: p.id,
                user_id: user.id,
                date: p.date || null,
                time: p.time,
                task: p.task,
                description: p.description || null,
                completed: p.completed || false,
                task_id: p.taskId || null,
              }));
            const toDelete = prev
              .filter((p: DailyPlanItem) => p.id && !nextMap.has(p.id))
              .map((p: DailyPlanItem) => p.id);

            if (toUpsert.length > 0)
              supabase.from("daily_plan_items").upsert(toUpsert).then();
            if (toDelete.length > 0)
              supabase
                .from("daily_plan_items")
                .delete()
                .in("id", toDelete)
                .then();
          });
        }
        return next;
      });
    },
    [isDataLoaded, supabase],
  );

  const setNotes = useCallback(
    (action: React.SetStateAction<Note[]>) => {
      setNotesState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        if (isDataLoaded) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            const nextMap = new Map(next.map((n: Note) => [n.id, n]));
            const prevMap = new Map(prev.map((n: Note) => [n.id, n]));

            const toUpsert = next
              .filter(
                (n: Note) =>
                  JSON.stringify(n) !== JSON.stringify(prevMap.get(n.id)),
              )
              .map((n: Note) => ({
                id: n.id,
                user_id: user.id,
                title: n.title,
                content: n.content,
                created_at: n.createdAt,
                dismissed_from_dashboard: n.dismissedFromDashboard || false,
              }));
            const toDelete = prev
              .filter((n: Note) => !nextMap.has(n.id))
              .map((n: Note) => n.id);

            if (toUpsert.length > 0)
              supabase.from("notes").upsert(toUpsert).then();
            if (toDelete.length > 0)
              supabase.from("notes").delete().in("id", toDelete).then();
          });
        }
        return next;
      });
    },
    [isDataLoaded, supabase],
  );

  const setTrash = useCallback(
    (action: React.SetStateAction<TrashItem[]>) => {
      setTrashState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        if (isDataLoaded) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            const nextMap = new Map(next.map((t: TrashItem) => [t.id, t]));
            const prevMap = new Map(prev.map((t: TrashItem) => [t.id, t]));

            const toUpsert = next
              .filter(
                (t: TrashItem) =>
                  JSON.stringify(t) !== JSON.stringify(prevMap.get(t.id)),
              )
              .map((t: TrashItem) => ({
                id: t.id,
                user_id: user.id,
                type: t.type,
                task: t.task || null,
                plan_item: t.planItem || null,
                note: t.note || null,
                deleted_at: t.deletedAt,
              }));
            const toDelete = prev
              .filter((t: TrashItem) => !nextMap.has(t.id))
              .map((t: TrashItem) => t.id);

            if (toUpsert.length > 0)
              supabase.from("trash").upsert(toUpsert).then();
            if (toDelete.length > 0)
              supabase.from("trash").delete().in("id", toDelete).then();
          });
        }
        return next;
      });
    },
    [isDataLoaded, supabase],
  );

  const syncPreferences = useCallback(
    async (newUser: UserProfile, newFocus: FocusTask, newInsight: string) => {
      if (!isDataLoaded) return;
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;
      const { name, role, avatarUrl, ...prefs } = newUser;
      await supabase.from("user_preferences").upsert({
        user_id: authUser.id,
        preferences: prefs,
        focus_task: newFocus,
        insight: newInsight,
      });
    },
    [isDataLoaded, supabase],
  );

  const setUser = useCallback(
    (action: React.SetStateAction<UserProfile>) => {
      setUserState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        syncPreferences(next, focusTaskState, insightState);
        return next;
      });
    },
    [syncPreferences, focusTaskState, insightState],
  );

  const setFocusTask = useCallback(
    (action: React.SetStateAction<FocusTask>) => {
      setFocusTaskState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        syncPreferences(userState, next, insightState);
        return next;
      });
    },
    [syncPreferences, userState, insightState],
  );

  const setInsight = useCallback(
    (action: React.SetStateAction<string>) => {
      setInsightState((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;
        syncPreferences(userState, focusTaskState, next);
        return next;
      });
    },
    [syncPreferences, userState, focusTaskState],
  );

  const setTaskToDelete = (t: React.SetStateAction<Task | null>) => {
    if (typeof t === "function") {
      setDeleteTargetTasks((prev) => {
        const next = t(prev[0] || null);
        return next ? [next] : [];
      });
    } else {
      setDeleteTargetTasks(t ? [t] : []);
    }
  };

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const savedFocus = localStorage.getItem(STORAGE_KEYS.FOCUS);
      const savedPlan = localStorage.getItem(STORAGE_KEYS.PLAN);
      const savedInsight = localStorage.getItem(STORAGE_KEYS.INSIGHT);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
      const savedTrash = localStorage.getItem(STORAGE_KEYS.TRASH);

      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasksState(parsedTasks);
      }
      if (savedFocus) setFocusTaskState(JSON.parse(savedFocus));
      if (savedPlan) setDailyPlanState(JSON.parse(savedPlan));
      if (savedInsight) setInsightState(JSON.parse(savedInsight));
      if (savedUser) setUserState(JSON.parse(savedUser));
      if (savedNotes) setNotesState(JSON.parse(savedNotes));
      if (savedTrash) setTrashState(JSON.parse(savedTrash));
    } catch (e) {
      console.warn("Failed to load state from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser || !active) {
          setIsDataLoaded(true);
          return;
        }

        const [
          { data: profile },
          { data: dbTasks },
          { data: dbPlan },
          { data: dbNotes },
          { data: dbTrash },
          { data: dbPrefs },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("name, username, avatar_url, email")
            .eq("id", authUser.id)
            .maybeSingle(),
          supabase.from("tasks").select("*"),
          supabase.from("daily_plan_items").select("*"),
          supabase.from("notes").select("*"),
          supabase.from("trash").select("*"),
          supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ]);

        if (!active) return;

        let avatarUrl = profile?.avatar_url || "";
        const pendingAvatar = localStorage.getItem("daydraft_pending_avatar");
        if (pendingAvatar) {
          const match = pendingAvatar.match(
            /^data:image\/(jpeg|png|webp);base64,(.+)$/,
          );
          if (match) {
            const bytes = Uint8Array.from(atob(match[2]), (character) =>
              character.charCodeAt(0),
            );
            const path = `${authUser.id}.jpg`;
            const upload = await supabase.storage
              .from("avatars")
              .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
            if (!upload.error) {
              avatarUrl = supabase.storage.from("avatars").getPublicUrl(path)
                .data.publicUrl;
              await supabase
                .from("profiles")
                .update({ avatar_url: avatarUrl })
                .eq("id", authUser.id);
              localStorage.removeItem("daydraft_pending_avatar");
            }
          }
        }

        if (dbTasks) {
          setTasksState(
            dbTasks.map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority as any,
              deadline: t.deadline || undefined,
              category: t.category || undefined,
              completed: t.completed,
              createdAt: t.created_at || undefined,
            })),
          );
        }
        if (dbPlan) {
          setDailyPlanState(
            dbPlan.map((p) => ({
              id: p.id,
              date: p.date || undefined,
              time: p.time,
              task: p.task,
              description: p.description || undefined,
              completed: p.completed,
              taskId: p.task_id || undefined,
            })),
          );
        }
        if (dbNotes) {
          setNotesState(
            dbNotes.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              createdAt: n.created_at,
              dismissedFromDashboard: n.dismissed_from_dashboard,
            })),
          );
        }
        if (dbTrash) {
          setTrashState(
            dbTrash.map((t) => ({
              id: t.id,
              type: t.type as any,
              task: t.task,
              planItem: t.plan_item,
              note: t.note,
              deletedAt: t.deleted_at,
            })),
          );
        }

        let newInsight = insightState;
        let newFocus = focusTaskState;
        if (dbPrefs) {
          if (dbPrefs.insight) newInsight = dbPrefs.insight;
          if (dbPrefs.focus_task) newFocus = dbPrefs.focus_task;

          setUserState((current) => ({
            ...current,
            ...(dbPrefs.preferences || {}),
            name: profile?.name || current.name,
            role: profile?.username || current.role,
            avatarUrl,
          }));
        } else {
          setUserState((current) => ({
            ...current,
            name: profile?.name || current.name,
            role: profile?.username || current.role,
            avatarUrl,
          }));
        }
        setInsightState(newInsight);
        setFocusTaskState(newFocus);

        setIsDataLoaded(true);
      } catch (e) {
        console.warn("Failed to load from supabase", e);
        setIsDataLoaded(true);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksState));
      localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(focusTaskState));
      localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(dailyPlanState));
      localStorage.setItem(STORAGE_KEYS.INSIGHT, JSON.stringify(insightState));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userState));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notesState));
      localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(trashState));
    } catch (e) {
      console.warn("Failed to save state to localStorage:", e);
    }
  }, [
    tasksState,
    focusTaskState,
    dailyPlanState,
    insightState,
    userState,
    notesState,
    trashState,
    isHydrated,
  ]);

  useEffect(() => {
    if (!isHydrated || !isDataLoaded) return;
    const expiration = userState.trashExpiration || "No expiration";
    if (expiration === "No expiration") return;

    const now = new Date().getTime();
    let daysToKeep = 30;
    if (expiration === "1 week") daysToKeep = 7;
    else if (expiration === "30 days") daysToKeep = 30;
    else if (expiration === "6 months") daysToKeep = 180;
    else if (expiration === "1 year") daysToKeep = 365;

    const msToKeep = daysToKeep * 24 * 60 * 60 * 1000;

    setTrash((prev) => {
      const filtered = prev.filter((item) => {
        const deletedTime = new Date(item.deletedAt).getTime();
        return now - deletedTime < msToKeep;
      });
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });
  }, [userState.trashExpiration, isHydrated, isDataLoaded]);

  useEffect(() => {
    if (isHydrated && !userState.name) {
      setIsSettingsOpen(true);
    }
  }, [isHydrated, userState.name]);

  const handleToggleTask = (id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      );
      const allDone = next.length > 0 && next.every((t) => t.completed);
      if (allDone) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#059669", "#10B981", "#10B981"],
          });
        } catch {}
      }
      return next;
    });
  };

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleDeleteTask = (id: string) => {
    const t = tasksState.find((x) => x.id === id);
    if (!t) return;
    setDeleteTargetTasks([t]);
    setDeleteTargetPlanItems([]);
    setDeleteModalOpen(true);
  };

  const handleBatchDeleteTasks = (ids: string[]) => {
    const targetTasks = tasksState.filter((x) => ids.includes(x.id));
    if (targetTasks.length === 0) return;
    setDeleteTargetTasks(targetTasks);
    setDeleteTargetPlanItems([]);
    setDeleteModalOpen(true);
  };

  const handleDeletePlanItem = (id: string) => {
    const item = dailyPlanState.find((p) => p.id === id);
    if (!item) return;
    setDeleteTargetTasks([]);
    setDeleteTargetPlanItems([item]);
    setDeleteModalOpen(true);
  };

  const handleBatchDeletePlanItems = (ids: string[]) => {
    const targetItems = dailyPlanState.filter(
      (p) => p.id && ids.includes(p.id),
    );
    if (targetItems.length === 0) return;
    setDeleteTargetTasks([]);
    setDeleteTargetPlanItems(targetItems);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = ({
    saveToTrash,
    alsoRemoveLinkedSchedule,
  }: {
    saveToTrash: boolean;
    alsoRemoveLinkedSchedule: boolean;
  }) => {
    const now = new Date().toISOString();
    const taskIdsToDelete = new Set(deleteTargetTasks.map((t) => t.id));
    const planItemIdsToDelete = new Set(
      deleteTargetPlanItems.map((p) => p.id).filter(Boolean) as string[],
    );

    const linkedPlanItemIdsToRemove = new Set<string>();
    if (alsoRemoveLinkedSchedule && deleteTargetTasks.length > 0) {
      dailyPlanState.forEach((p) => {
        if (
          (p.taskId && taskIdsToDelete.has(p.taskId)) ||
          deleteTargetTasks.some(
            (t) => t.title.toLowerCase() === p.task.toLowerCase(),
          )
        ) {
          if (p.id) linkedPlanItemIdsToRemove.add(p.id);
        }
      });
    }

    if (saveToTrash) {
      const newTrashItems: TrashItem[] = [];
      deleteTargetTasks.forEach((task) => {
        const linkedPlan = dailyPlanState.find(
          (p) =>
            p.taskId === task.id ||
            p.task.toLowerCase() === task.title.toLowerCase(),
        );
        if (alsoRemoveLinkedSchedule && linkedPlan) {
          newTrashItems.push({
            id: crypto.randomUUID(),
            type: "both",
            task: { ...task },
            planItem: { ...linkedPlan },
            deletedAt: now,
          });
        } else {
          newTrashItems.push({
            id: crypto.randomUUID(),
            type: "task",
            task: { ...task },
            deletedAt: now,
          });
        }
      });

      deleteTargetPlanItems.forEach((planItem) => {
        const alreadyCovered =
          alsoRemoveLinkedSchedule &&
          deleteTargetTasks.some(
            (t) =>
              t.id === planItem.taskId ||
              t.title.toLowerCase() === planItem.task.toLowerCase(),
          );
        if (!alreadyCovered) {
          newTrashItems.push({
            id: crypto.randomUUID(),
            type: "planItem",
            planItem: { ...planItem },
            deletedAt: now,
          });
        }
      });

      if (newTrashItems.length > 0) {
        setTrash((prev) => [...newTrashItems, ...prev]);
      }
    }

    if (taskIdsToDelete.size > 0) {
      setTasks((prev) => prev.filter((t) => !taskIdsToDelete.has(t.id)));
    }

    const allPlanIdsToRemove = new Set([
      ...planItemIdsToDelete,
      ...linkedPlanItemIdsToRemove,
    ]);
    if (allPlanIdsToRemove.size > 0) {
      setDailyPlan((prev) =>
        prev.filter((p) => !p.id || !allPlanIdsToRemove.has(p.id)),
      );
    }

    setDeleteModalOpen(false);
    setDeleteTargetTasks([]);
    setDeleteTargetPlanItems([]);
  };

  const confirmDeleteDashboardOnly = () =>
    handleConfirmDelete({ saveToTrash: true, alsoRemoveLinkedSchedule: false });
  const confirmDeleteEverywhere = () =>
    handleConfirmDelete({ saveToTrash: true, alsoRemoveLinkedSchedule: true });

  const handleUpdateTaskPriority = (id: string, newPriority: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: newPriority } : t)),
    );
  };

  const handleTogglePlanItem = (id: string) => {
    setDailyPlan((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleAddPlanItem = (newItem: DailyPlanItem) => {
    setDailyPlan((prev) =>
      [...prev, { ...newItem, id: crypto.randomUUID() }].sort((a, b) =>
        a.time.localeCompare(b.time),
      ),
    );
  };

  const handleDeleteNote = (id: string) => {
    const item = notesState.find((n) => n.id === id);
    if (!item) return;
    setTrash((prev) => [
      {
        id: crypto.randomUUID(),
        type: "note" as const,
        note: item,
        deletedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleBatchDeleteNotes = (ids: string[]) => {
    const items = notesState.filter((n) => ids.includes(n.id));
    if (items.length === 0) return;
    const newTrashItems = items.map((item) => ({
      id: crypto.randomUUID(),
      type: "note" as const,
      note: item,
      deletedAt: new Date().toISOString(),
    }));
    setTrash((prev) => [...newTrashItems, ...prev]);
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
  };

  const restoreFromTrash = (id: string) => {
    const item = trashState.find((t) => t.id === id);
    if (!item) return;
    if (item.type === "task" || item.type === "both") {
      if (item.task) setTasks((prev) => [...prev, item.task!]);
    }
    if (item.type === "planItem" || item.type === "both") {
      if (item.planItem)
        setDailyPlan((prev) =>
          [...prev, item.planItem!].sort((a, b) =>
            a.time.localeCompare(b.time),
          ),
        );
    }
    if (item.type === "note" && item.note) {
      setNotes((prev) => [...prev, item.note!]);
    }
    setTrash((prev) => prev.filter((t) => t.id !== id));
  };

  const permanentlyDeleteFromTrash = (id: string) => {
    setTrash((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetData = async () => {
    setTasks(INITIAL_TASKS);
    setFocusTask(INITIAL_FOCUS_TASK);
    setDailyPlan(INITIAL_DAILY_PLAN);
    setInsight(INITIAL_INSIGHT);
    setUser(DEFAULT_USER);
    setNotes([]);
    setTrash([]);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      await Promise.all([
        supabase.from("tasks").delete().eq("user_id", authUser.id),
        supabase.from("daily_plan_items").delete().eq("user_id", authUser.id),
        supabase.from("notes").delete().eq("user_id", authUser.id),
        supabase.from("trash").delete().eq("user_id", authUser.id),
        supabase.from("user_preferences").delete().eq("user_id", authUser.id),
      ]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isHydrated,
        tasks: tasksState,
        setTasks,
        focusTask: focusTaskState,
        setFocusTask,
        dailyPlan: dailyPlanState,
        setDailyPlan,
        insight: insightState,
        setInsight,
        notes: notesState,
        setNotes,
        user: userState,
        setUser,
        trash: trashState,
        setTrash,
        isSettingsOpen,
        setIsSettingsOpen,
        handleToggleTask,
        handleAddTask,
        handleDeleteTask,
        handleBatchDeleteTasks,
        handleUpdateTaskPriority,
        handleTogglePlanItem,
        handleAddPlanItem,
        handleDeletePlanItem,
        handleBatchDeletePlanItems,
        handleDeleteNote,
        handleBatchDeleteNotes,
        restoreFromTrash,
        permanentlyDeleteFromTrash,
        handleResetData,
        deleteModalOpen,
        setDeleteModalOpen,
        taskToDelete,
        setTaskToDelete,
        confirmDeleteDashboardOnly,
        confirmDeleteEverywhere,
      }}
    >
      {(() => {
        const isDashboardRoute =
          pathname?.startsWith("/dashboard") ||
          pathname?.startsWith("/tasks") ||
          pathname?.startsWith("/calendar") ||
          pathname?.startsWith("/notes") ||
          pathname?.startsWith("/trash") ||
          pathname?.startsWith("/profile");
        if (!isDashboardRoute) return null;

        const activeTheme = userState.activeTheme;
        const savedThemes = userState.savedThemes || [];
        const builtinIds = ["light", "dark", "red", "catppuccin", "onedark"];
        if (activeTheme && !builtinIds.includes(activeTheme)) {
          const theme = savedThemes.find((t) => t.id === activeTheme);
          if (theme?.css)
            return <style dangerouslySetInnerHTML={{ __html: theme.css }} />;
        }
        if (userState.customCss)
          return (
            <style dangerouslySetInnerHTML={{ __html: userState.customCss }} />
          );
        return null;
      })()}
      {children}
      {deleteModalOpen &&
        (deleteTargetTasks.length > 0 || deleteTargetPlanItems.length > 0) && (
          <DeleteConfirmationModal
            tasks={deleteTargetTasks}
            planItems={deleteTargetPlanItems}
            hasLinkedSchedule={deleteTargetTasks.some((t) =>
              dailyPlanState.some(
                (p) =>
                  p.taskId === t.id ||
                  p.task.toLowerCase() === t.title.toLowerCase(),
              ),
            )}
            onClose={() => {
              setDeleteModalOpen(false);
              setDeleteTargetTasks([]);
              setDeleteTargetPlanItems([]);
            }}
            onConfirm={handleConfirmDelete}
            onDeleteDashboard={confirmDeleteDashboardOnly}
            onDeleteEverywhere={confirmDeleteEverywhere}
          />
        )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

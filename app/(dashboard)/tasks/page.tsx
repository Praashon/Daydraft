"use client";

import React from "react";
import { TasksView } from "@/components/tasks-view";
import { useAppContext } from "@/components/app-provider";
import { motion } from "framer-motion";

export default function TasksPage() {
  const {
    tasks,
    handleToggleTask,
    handleAddTask,
    handleDeleteTask,
    handleUpdateTaskPriority,
  } = useAppContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <TasksView
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onUpdateTaskPriority={handleUpdateTaskPriority}
      />
    </motion.div>
  );
}

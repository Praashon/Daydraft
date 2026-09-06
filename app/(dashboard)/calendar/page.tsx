"use client";

import React from "react";
import { CalendarView } from "@/components/calendar-view";
import { useAppContext } from "@/components/app-provider";
import { motion } from "framer-motion";

export default function CalendarPage() {
  const { dailyPlan, handleTogglePlanItem, handleAddPlanItem } = useAppContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <CalendarView
        plan={dailyPlan}
        onTogglePlanItem={handleTogglePlanItem}
        onAddPlanItem={handleAddPlanItem}
      />
    </motion.div>
  );
}

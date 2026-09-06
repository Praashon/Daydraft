"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SettingsModal } from "@/components/settings-modal";
import { useAppContext } from "@/components/app-provider";
import { usePathname, useRouter } from "next/navigation";
import { ActiveView } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser, tasks, isSettingsOpen, setIsSettingsOpen, handleResetData } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  let activeView: ActiveView = "dashboard";
  if (pathname.includes("/tasks")) activeView = "tasks";
  if (pathname.includes("/calendar")) activeView = "calendar";
  if (pathname.includes("/notes")) activeView = "notes";
  if (pathname.includes("/trash")) activeView = "trash";
  if (pathname.includes("/profile")) activeView = "profile";

  const remainingTasks = tasks.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col md:flex-row">
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          if (view === "landing") router.push("/");
          else if (view === "dashboard") router.push("/dashboard");
          else router.push(`/${view}`);
        }}
        user={user}
        taskCount={remainingTasks}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full">
        <Header
          userName={user.name}
          activeView={activeView}
          onViewChange={(view) => {
            if (view === "landing") router.push("/");
            else if (view === "dashboard") router.push("/dashboard");
            else router.push(`/${view}`);
          }}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        {children}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onSaveUser={setUser}
        onResetData={handleResetData}
      />
    </div>
  );
}

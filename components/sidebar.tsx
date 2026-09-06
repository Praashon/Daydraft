"use client";

import React, { useState } from "react";
import { LayoutDashboard, CheckSquare, Calendar, Settings, X, Moon, Sun, PanelLeftClose, PanelLeftOpen, Trash2, BookOpen, Palette, LogOut } from "lucide-react";
import { ActiveView, UserProfile } from "@/types";
import { useTheme } from "@/components/theme-provider";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/app-provider";

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  user: UserProfile;
  taskCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  activeView,
  onViewChange,
  user,
  taskCount,
  isOpenMobile = false,
  onCloseMobile,
  onOpenSettings,
}: SidebarProps) {
  const { theme, setTheme, resolvedTheme, toggleTheme: themeToggle } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { isHydrated } = useAppContext();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const navItems = [
    {
      id: "dashboard" as ActiveView,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "tasks" as ActiveView,
      label: "My Tasks",
      icon: CheckSquare,
      badge: taskCount > 0 ? taskCount : undefined,
    },
    {
      id: "calendar" as ActiveView,
      label: "Calendar",
      icon: Calendar,
    },
    {
      id: "notes" as ActiveView,
      label: "Notes",
      icon: BookOpen,
    },
    {
      id: "trash" as ActiveView,
      label: "Trash",
      icon: Trash2,
    },
  ];

  const toggleTheme = () => {
    themeToggle();
  };

  const sidebarOpt = user.sidebarOption || 'hover';
  const forceShow = sidebarOpt === 'show';
  const allowHover = sidebarOpt === 'hover';

  const isActuallyCollapsed = !forceShow && isCollapsed && (!allowHover || !isHovered) && !isOpenMobile;

  const sidebarContent = (
    <div 
      className={`flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out select-none ${isActuallyCollapsed ? 'w-20 p-3' : 'w-64 p-5'}`}
      onMouseEnter={() => allowHover && !forceShow && isCollapsed && setIsHovered(true)}
      onMouseLeave={() => allowHover && !forceShow && isCollapsed && setIsHovered(false)}
    >
      <div className={`flex pb-6 mb-4 border-b border-zinc-200 dark:border-zinc-800 transition-all ${isActuallyCollapsed ? 'flex-col items-center gap-4' : 'flex-row items-center justify-between'}`}>
        <div
          onClick={() => onViewChange("landing")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <Image src="/logo.jpg" alt="Daydraft Logo" width={32} height={32} className="object-cover" />
          </div>
          {!isActuallyCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <span className="font-semibold text-[17px] text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1">
                Daydraft
              </span>
              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 tracking-wide">
                Clarity from chaos
              </span>
            </div>
          )}
        </div>

        {isOpenMobile && onCloseMobile ? (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          !forceShow && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )
        )}
      </div>

      <nav className="space-y-1.5 flex-1">
        {!isActuallyCollapsed && (
          <span className="label-small uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-3 mb-2 block whitespace-nowrap overflow-hidden">
            Navigation
          </span>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (isOpenMobile && onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
              title={isActuallyCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                />
                {!isActuallyCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </div>

              {!isActuallyCollapsed && item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 transition-all`}>
        <div className={`flex ${isActuallyCollapsed ? 'flex-col gap-2' : 'flex-row items-center justify-between gap-1'} px-1`}>
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-3 p-2 rounded-xl text-[14px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${!isActuallyCollapsed && 'flex-1'}`}
            title={isActuallyCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4" />
            {!isActuallyCollapsed && <span>Settings</span>}
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Toggle theme"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div 
          onClick={() => {
            onViewChange("profile");
            if (isOpenMobile && onCloseMobile) onCloseMobile();
          }}
          className={`flex items-center ${isActuallyCollapsed ? 'justify-center p-1.5' : 'justify-between p-2.5'} rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 group`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-medium text-xs overflow-hidden shrink-0 group-hover:ring-2 ring-emerald-500/50 transition-all">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || "User avatar"} className="w-full h-full object-cover" />
              ) : isHydrated ? (
                user.name?.charAt(0) || user.username?.charAt(0) || user.role?.charAt(0) || "U"
              ) : (
                ""
              )}
            </div>
            {!isActuallyCollapsed && (
              <div className="min-w-0">
                <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                  {user.name || (isHydrated ? "Daydraft User" : "")}
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {user.username
                    ? `@${user.username}`
                    : user.role
                    ? `@${user.role}`
                    : isHydrated
                    ? "Update profile"
                    : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden md:block sticky top-0 h-screen shrink-0 transition-all duration-300 z-40 ${!forceShow && isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="absolute top-0 left-0 h-full">
          {sidebarContent}
        </div>
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

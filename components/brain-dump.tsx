"use client";

import React, { useState } from "react";
import {
  ListChecks,
  ArrowRight,
  X,
  Command,
  Lightbulb,
  Globe,
  Zap,
  Settings,
  ChevronDown,
} from "lucide-react";
import { PRESET_BRAIN_DUMPS } from "@/lib/sample-data";
import { useAppContext } from "./app-provider";

interface BrainDumpProps {
  onOrganize: (
    text: string,
    overrideProvider?: "openrouter" | "gemini",
  ) => void;
  isLoading: boolean;
  provider?: "openrouter" | "gemini";
  modelName?: string;
  onOpenSettings?: () => void;
}

export function BrainDump({
  onOrganize,
  isLoading,
  provider,
  modelName,
  onOpenSettings,
}: BrainDumpProps) {
  const [text, setText] = useState("");
  const { user, setIsSettingsOpen } = useAppContext();

  const [localProvider, setLocalProvider] = useState<
    "openrouter" | "gemini" | null
  >(null);
  const activeProvider = localProvider || user.aiProvider || "openrouter";

  const hasBothKeys = true;
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onOrganize(text.trim(), activeProvider);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleApplyPreset = (presetText: string) => {
    setText(presetText);
  };

  const openSettings = onOpenSettings || (() => setIsSettingsOpen(true));

  return (
    <div className="relative bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 subtle-card-shadow transition-all duration-300 focus-within:border-emerald-600 dark:border-emerald-500/40 focus-within:shadow-[0_8px_30px_rgb(99,91,255,0.06)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <h2 className="page-heading text-zinc-900 dark:text-zinc-100">
              What's on your mind?
            </h2>
          </div>
          <p className="body-text text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Write down everything you need to do, remember, plan, or figure out.
            Daydraft will organize it for you.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              hasBothKeys
                ? setShowProviderMenu(!showProviderMenu)
                : openSettings()
            }
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-[#EEF2FF] hover:border-emerald-600 dark:border-emerald-500/30 transition-all text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:text-emerald-500 cursor-pointer group shrink-0 active:scale-95"
            title={
              hasBothKeys ? "Switch AI Engine" : "Click to configure AI Engine"
            }
          >
            {activeProvider === "gemini" ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:text-emerald-500">
                  Google Gemini
                </span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:text-emerald-500">
                  OpenRouter
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hidden sm:inline">
                  FREE
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 max-w-[110px] sm:max-w-[150px] truncate hidden sm:inline">
                  {user.selectedModel || modelName || "Free Auto-Router"}
                </span>
              </>
            )}
            {hasBothKeys ? (
              <ChevronDown className="w-3 h-3 ml-0.5 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:text-emerald-500" />
            ) : (
              <Settings className="w-3 h-3 ml-0.5 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:text-emerald-500" />
            )}
          </button>

          {showProviderMenu && hasBothKeys && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1 z-10 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setLocalProvider("openrouter");
                  setShowProviderMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors active:scale-95 ${activeProvider === "openrouter" ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 font-semibold" : "hover:bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"}`}
              >
                <Globe className="w-3.5 h-3.5" /> OpenRouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalProvider("gemini");
                  setShowProviderMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors active:scale-95 ${activeProvider === "gemini" ? "bg-amber-50/50 text-amber-600 font-semibold" : "hover:bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"}`}
              >
                <Zap className="w-3.5 h-3.5" /> Google Gemini
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={4}
          placeholder="I need to finish my assignment by Friday, call someone tonight, buy groceries, prepare for next week's presentation..."
          className="w-full bg-transparent border-0 resize-none text-[15px] sm:text-[16px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:text-zinc-400/60 focus:outline-none leading-relaxed transition-all"
        />

        {text && !isLoading && (
          <button
            type="button"
            onClick={() => setText("")}
            className="absolute top-0 right-0 p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 transition-all active:scale-90"
            title="Clear text"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="label-small text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Try an example:
          </span>
          {PRESET_BRAIN_DUMPS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleApplyPreset(preset.text)}
              className="label-small px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-[#EEF2FF] hover:text-emerald-600 dark:text-emerald-500 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="hidden sm:inline-flex items-center gap-1 label-small text-zinc-500 dark:text-zinc-400">
            <Command className="w-3 h-3" /> + Enter
          </span>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!text.trim() || isLoading}
            className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ListChecks className="w-4 h-4 text-white/90" />
            <span>{isLoading ? "Organizing..." : "Organize my thoughts"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

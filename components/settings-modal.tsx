"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Key,
  User,
  Check,
  ExternalLink,
  RefreshCw,
  Bot,
  Globe,
  Zap,
  Info,
  Palette,
  Code,
  Trash2,
  Plus,
  Paintbrush,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  UserProfile,
  AIProvider,
  OpenRouterModel,
  SidebarOption,
  SavedTheme,
} from "@/types";
import { useTheme } from "@/components/theme-provider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveUser: (user: UserProfile) => void;
  onResetData: () => void;
}

const BUILTIN_THEMES = [
  {
    id: "light",
    name: "Light",
    description: "Clean white workspace",
    preview: { bg: "#ffffff", accent: "#059669" },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes",
    preview: { bg: "#09090b", accent: "#10b981" },
  },
  {
    id: "red",
    name: "Red",
    description: "Bold red accent on light",
    preview: { bg: "#ffffff", accent: "#dc2626" },
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Mocha pastel dark theme",
    preview: { bg: "#1e1e2e", accent: "#cba6f7" },
  },
  {
    id: "onedark",
    name: "One Dark",
    description: "Atom One Dark inspired",
    preview: { bg: "#282c34", accent: "#61afef" },
  },
] as const;

export function SettingsModal({
  isOpen,
  onClose,
  user,
  onSaveUser,
}: SettingsModalProps) {
  const { setTheme } = useTheme();

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [aiProvider, setAiProvider] = useState<AIProvider>(
    user.aiProvider || "openrouter",
  );
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openRouterKeyInfo, setOpenRouterKeyInfo] = useState<{hasKey: boolean, last4?: string}>({hasKey: false});
  const [geminiKeyInfo, setGeminiKeyInfo] = useState<{hasKey: boolean, last4?: string}>({hasKey: false});
  const [isSavingKey, setIsSavingKey] = useState<"openrouter" | "gemini" | null>(null);
  const [saveKeyError, setSaveKeyError] = useState<{ provider: string; message: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState(user.selectedModel || "");
  const [activeTheme, setActiveTheme] = useState(user.activeTheme || "light");
  const [sidebarOption, setSidebarOption] = useState<SidebarOption>(
    user.sidebarOption || "hover",
  );
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(
    user.savedThemes || [],
  );
  const [activeTab, setActiveTab] = useState<"profile" | "themes">("profile");
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeCss, setNewThemeCss] = useState("");
  const [themeNameError, setThemeNameError] = useState("");

  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingThemeCss, setEditingThemeCss] = useState("");

  const fetchKeyMetadata = async (provider: "openrouter" | "gemini") => {
    try {
      const res = await fetch(`/api/settings/api-key?provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        if (provider === "openrouter") setOpenRouterKeyInfo(data);
        else setGeminiKeyInfo(data);
      }
    } catch (e) {}
  };

  const handleSaveKey = async (provider: "openrouter" | "gemini") => {
    const keyToSave = provider === "openrouter" ? openRouterApiKey : geminiApiKey;
    if (!keyToSave) return;
    setIsSavingKey(provider);
    setSaveKeyError(null);
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: keyToSave })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (provider === "openrouter") {
          setOpenRouterKeyInfo({ hasKey: true, last4: data.last4 });
          setOpenRouterApiKey("");
        } else {
          setGeminiKeyInfo({ hasKey: true, last4: data.last4 });
          setGeminiApiKey("");
        }
        setSaveKeyError(null);
      } else {
        setSaveKeyError({
          provider,
          message: data.error || "Failed to save API key",
        });
      }
    } catch (e: unknown) {
      setSaveKeyError({
        provider,
        message: (e as Error)?.message || "Network error saving API key",
      });
    } finally {
      setIsSavingKey(null);
    }
  };

  const handleRemoveKey = async (provider: "openrouter" | "gemini") => {
    try {
      const res = await fetch(`/api/settings/api-key?provider=${provider}`, { method: "DELETE" });
      if (res.ok) {
        if (provider === "openrouter") {
          setOpenRouterKeyInfo({ hasKey: false });
          setOpenRouterApiKey("");
        } else {
          setGeminiKeyInfo({ hasKey: false });
          setGeminiApiKey("");
        }
        setSaveKeyError(null);
      }
    } catch (e) {}
  };

  const fetchFreeModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("/api/models?refresh=1", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      }
    } catch (err) {
      console.warn("Failed to load models list:", err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(user.name || "");
      setRole(user.role || "");
      setAiProvider(user.aiProvider || "openrouter");
      setOpenRouterApiKey("");
      setGeminiApiKey("");
      setSelectedModel(user.selectedModel || "");
      setActiveTheme(user.activeTheme || "light");
      setSidebarOption(user.sidebarOption || "hover");
      setSavedThemes(user.savedThemes || []);
      setIsCreatingTheme(false);
      setNewThemeName("");
      setNewThemeCss("");
      setEditingThemeId(null);
      setIsModelPickerOpen(false);
      setModelSearch("");
      setIsSavingKey(null);
      setSaveKeyError(null);
      fetchFreeModels();
      fetchKeyMetadata("openrouter");
      fetchKeyMetadata("gemini");
    }
  }, [isOpen, user]);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    provider: string;
    success: boolean;
    message?: string;
  } | null>(null);

  const handleTestKey = async (provider: "openrouter" | "gemini") => {
    const keyToTest =
      provider === "openrouter" ? openRouterApiKey : geminiApiKey;
    if (!keyToTest) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: keyToTest }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ provider, success: true });
      } else {
        setTestResult({
          provider,
          success: false,
          message: data.error || "Failed to verify key",
        });
      }
    } catch {
      setTestResult({ provider, success: false, message: "Network error" });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  const handleActivateTheme = (themeId: string) => {
    setActiveTheme(themeId);
    const isBuiltin = BUILTIN_THEMES.some((t) => t.id === themeId);
    if (isBuiltin) setTheme(themeId);
  };

  const handleSaveNewTheme = () => {
    const trimmedName = newThemeName.trim();
    if (!trimmedName) {
      setThemeNameError("Theme name is required");
      return;
    }
    if (
      savedThemes.some(
        (t) => t.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setThemeNameError("A theme with this name already exists");
      return;
    }
    const newTheme: SavedTheme = {
      id: crypto.randomUUID(),
      name: trimmedName,
      css: newThemeCss,
      createdAt: new Date().toISOString(),
    };
    setSavedThemes((prev) => [...prev, newTheme]);
    setIsCreatingTheme(false);
    setNewThemeName("");
    setNewThemeCss("");
    setThemeNameError("");
    handleActivateTheme(newTheme.id);
  };

  const handleDeleteTheme = (themeId: string) => {
    setSavedThemes((prev) => prev.filter((t) => t.id !== themeId));
    if (activeTheme === themeId) {
      setActiveTheme("light");
      setTheme("light");
    }
  };

  const handleSaveEditedTheme = (themeId: string) => {
    setSavedThemes((prev) =>
      prev.map((t) => (t.id === themeId ? { ...t, css: editingThemeCss } : t)),
    );
    setEditingThemeId(null);
  };

  const autoformatCss = (css: string) => {
    try {
      return css
        .replace(/\s+/g, " ")
        .replace(/\{\s+/g, "{\n  ")
        .replace(/;\s+/g, ";\n  ")
        .replace(/;\s*\}/g, ";\n}")
        .replace(/\}\s+/g, "}\n\n")
        .trim();
    } catch {
      return css;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser({
      ...user,
      name: name.trim(),
      role: role.trim(),
      aiProvider,
      selectedModel: aiProvider === "openrouter" ? selectedModel : undefined,
      activeTheme,
      savedThemes,
      sidebarOption,
    });
    const isBuiltin = BUILTIN_THEMES.some((t) => t.id === activeTheme);
    if (isBuiltin) setTheme(activeTheme);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="card-heading text-zinc-900 dark:text-zinc-100">
              Preferences &amp; AI Engine
            </h3>
            <p className="label-small text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configure free AI models, API keys, and workspace profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 gap-6 shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-500"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Profile &amp; AI
          </button>
          <button
            onClick={() => setActiveTab("themes")}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "themes"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-500"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Palette className="w-4 h-4" /> Themes
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          <form id="settings-form" onSubmit={handleSave} className="space-y-6">
            {activeTab === "themes" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-3">
                  <div className="label-small uppercase tracking-wider font-semibold flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Palette className="w-3.5 h-3.5" />
                    Built-in Themes
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {BUILTIN_THEMES.map((theme) => {
                      const isActive = activeTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleActivateTheme(theme.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                            isActive
                              ? "border-emerald-600 bg-emerald-600/5"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-lg shrink-0 border border-black/10 flex items-center justify-center"
                            style={{ backgroundColor: theme.preview.bg }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: theme.preview.accent }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {theme.name}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/10 text-emerald-600">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {theme.description}
                            </span>
                          </div>
                          {isActive && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="label-small uppercase tracking-wider font-semibold flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <Code className="w-3.5 h-3.5" />
                      Custom Themes
                      {savedThemes.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          {savedThemes.length}
                        </span>
                      )}
                    </div>
                    {!isCreatingTheme && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingTheme(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> New Theme
                      </button>
                    )}
                  </div>

                  {savedThemes.length === 0 && !isCreatingTheme && (
                    <div className="text-center py-6 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <Paintbrush className="w-8 h-8 mx-auto mb-2 text-zinc-400 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        No custom themes yet
                      </p>
                      <p className="text-xs mt-1 text-zinc-400 dark:text-zinc-500">
                        Create one to apply your own CSS variables
                      </p>
                    </div>
                  )}

                  {savedThemes.map((theme) => {
                    const isActive = activeTheme === theme.id;
                    const isEditing = editingThemeId === theme.id;
                    return (
                      <div
                        key={theme.id}
                        className={`rounded-xl border transition-all ${isActive ? "border-emerald-600" : "border-zinc-200 dark:border-zinc-800"}`}
                      >
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <div className="w-9 h-9 rounded-lg shrink-0 border border-black/10 bg-zinc-900 flex items-center justify-center">
                            <Code className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {theme.name}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/10 text-emerald-600 shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {new Date(theme.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => handleActivateTheme(theme.id)}
                                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              >
                                Apply
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) setEditingThemeId(null);
                                else {
                                  setEditingThemeId(theme.id);
                                  setEditingThemeCss(theme.css);
                                }
                              }}
                              className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title={isEditing ? "Cancel edit" : "Edit CSS"}
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTheme(theme.id)}
                              className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete theme"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {isEditing && (
                          <div className="px-3 pb-3 space-y-2">
                            <textarea
                              value={editingThemeCss}
                              onChange={(e) =>
                                setEditingThemeCss(e.target.value)
                              }
                              className="w-full h-32 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 body-text font-mono text-zinc-900 dark:text-zinc-100 text-xs resize-y focus:outline-none focus:border-emerald-600"
                              spellCheck={false}
                              placeholder=":root { --color-emerald-600: #your-color; }"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingThemeCss(
                                    autoformatCss(editingThemeCss),
                                  )
                                }
                                className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                              >
                                Autoformat
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingThemeId(null)}
                                className="px-3 py-1 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedTheme(theme.id)}
                                className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              >
                                Save CSS
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isCreatingTheme && (
                    <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-600">
                          New Custom Theme
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingTheme(false);
                            setThemeNameError("");
                          }}
                          className="p-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Theme Name
                        </label>
                        <input
                          type="text"
                          value={newThemeName}
                          onChange={(e) => {
                            setNewThemeName(e.target.value);
                            setThemeNameError("");
                          }}
                          placeholder="e.g. Dracula, Nord, Gruvbox..."
                          className={`w-full px-3 py-2 rounded-xl border text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 transition-all ${themeNameError ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"}`}
                        />
                        {themeNameError && (
                          <p className="text-[11px] text-red-500 mt-1">
                            {themeNameError}
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Custom CSS
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setNewThemeCss(autoformatCss(newThemeCss))
                            }
                            className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                          >
                            Autoformat
                          </button>
                        </div>
                        <textarea
                          value={newThemeCss}
                          onChange={(e) => setNewThemeCss(e.target.value)}
                          placeholder={`:root {\n  --color-emerald-500: #bd93f9;\n  --color-emerald-600: #6272a4;\n  --color-zinc-950: #282a36;\n  --color-zinc-100: #f8f8f2;\n}`}
                          className="w-full h-40 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 body-text font-mono text-xs resize-y focus:outline-none focus:border-emerald-600"
                          spellCheck={false}
                        />
                        <p className="text-[11px] mt-1.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                          Key variables: <code>--color-emerald-600</code>{" "}
                          (accent), <code>--color-zinc-950</code> (bg),{" "}
                          <code>--color-zinc-100</code> (text).
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingTheme(false);
                            setThemeNameError("");
                          }}
                          className="px-3 py-1.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNewTheme}
                          className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Theme
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 flex gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Custom themes use CSS variable overrides applied globally.
                    The app uses <code>--color-emerald-*</code> for accent
                    colors and <code>--color-zinc-*</code> for surfaces and
                    text. Changes take effect after saving preferences.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 label-small uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                    <User className="w-3.5 h-3.5" />
                    Profile Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block label-small text-zinc-500 dark:text-zinc-400 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Prashon"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 body-text focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block label-small text-zinc-500 dark:text-zinc-400 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Product Designer"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 body-text focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block label-small text-zinc-500 dark:text-zinc-400 mb-1">
                        Sidebar Behaviour
                      </label>
                      <select
                        value={sidebarOption}
                        onChange={(e) =>
                          setSidebarOption(e.target.value as SidebarOption)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 body-text focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-sm"
                      >
                        <option value="show">Always visible</option>
                        <option value="collapse">Collapsed (no hover)</option>
                        <option value="hover">
                          Collapse with hover-to-expand
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="label-small uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                      AI Engine Provider
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <Check className="w-3 h-3" /> Free Models Filtered
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {aiProvider === "openrouter" ? (
                        <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        setAiProvider(e.target.value as AIProvider);
                        setTestResult(null);
                      }}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                      <option value="openrouter">OpenRouter (Free)</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {aiProvider === "openrouter" && (
                    <div className="space-y-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Choose a free model
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            Select one model to unlock its API settings.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchFreeModels}
                          disabled={isLoadingModels}
                          className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                          aria-label="Refresh free models"
                          title="Refresh free models"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${isLoadingModels ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsModelPickerOpen((open) => !open)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-white px-3 py-3 text-left transition-colors hover:border-emerald-500 dark:border-emerald-800 dark:bg-zinc-950"
                        aria-expanded={isModelPickerOpen}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {selectedModel
                              ? models.find(
                                  (model) => model.id === selectedModel,
                                )?.name || selectedModel
                              : "Select a model to continue"}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isModelPickerOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isModelPickerOpen && (
                        <div className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
                          <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              value={modelSearch}
                              onChange={(e) => setModelSearch(e.target.value)}
                              placeholder="Search models"
                              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-xs text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                          <div className="max-h-52 space-y-1 overflow-y-auto">
                            {(filteredModels.length > 0
                              ? filteredModels
                              : models
                            ).map((model) => (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setIsModelPickerOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${selectedModel === model.id ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-semibold">
                                    {model.name}
                                  </span>
                                  <span className="block truncate text-[10px] text-zinc-400">
                                    {model.id}
                                  </span>
                                </span>
                                {selectedModel === model.id && (
                                  <Check className="h-4 w-4 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {aiProvider === "openrouter" && selectedModel && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            OpenRouter Free Models
                          </span>
                        </div>
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="label-small text-emerald-600 dark:text-emerald-500 hover:underline flex items-center gap-1 font-medium"
                        >
                          Get Free Key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div>
                        <label className="block label-small text-zinc-500 dark:text-zinc-400 mb-1 font-medium">
                          OpenRouter API Key
                        </label>
                        {openRouterKeyInfo.hasKey ? (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                              Saved (ends in {openRouterKeyInfo.last4})
                            </span>
                            <button type="button" onClick={() => handleRemoveKey("openrouter")} className="text-sm text-red-500 hover:text-red-600 font-semibold">Remove</button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Key className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-3 top-2.5" />
                              <input
                                type="password"
                                value={openRouterApiKey}
                                onChange={(e) => {
                                  setOpenRouterApiKey(e.target.value);
                                  setTestResult(null);
                                  setSaveKeyError(null);
                                }}
                                placeholder="sk-or-v1-..."
                                className="w-full pl-9 pr-20 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 body-text font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-sm"
                              />
                              {openRouterApiKey && (
                                <button
                                  type="button"
                                  disabled={isSavingKey === "openrouter"}
                                  onClick={() => handleSaveKey("openrouter")}
                                  className="absolute right-2 top-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-opacity"
                                >
                                  {isSavingKey === "openrouter" ? "Saving..." : "Save"}
                                </button>
                              )}
                            </div>
                            {saveKeyError && saveKeyError.provider === "openrouter" && (
                              <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                <X className="w-3 h-3 shrink-0" /> {saveKeyError.message}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="label-small text-zinc-500 dark:text-zinc-400 flex items-center gap-1 text-[11px]">
                                <Info className="w-3 h-3 shrink-0" />
                                Free models have zero credit cost ($0.00).
                              </p>
                              {openRouterApiKey && (
                                <button
                                  type="button"
                                  onClick={() => handleTestKey("openrouter")}
                                  disabled={isTesting}
                                  className="px-2 py-1 bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-600/20 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                                >
                                  {isTesting && testResult?.provider !== "gemini"
                                    ? "Testing..."
                                    : "Test Key"}
                                </button>
                              )}
                            </div>
                            {testResult && testResult.provider === "openrouter" && (
                              <p
                                className={`mt-2 text-xs font-medium flex items-center gap-1 ${testResult.success ? "text-emerald-600" : "text-red-500"}`}
                              >
                                {testResult.success ? (
                                  <>
                                    <Check className="w-3 h-3" /> API Key is working!
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> {testResult.message}
                                  </>
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {aiProvider === "gemini" && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Google Gemini AI
                          </span>
                        </div>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="label-small text-emerald-600 dark:text-emerald-500 hover:underline flex items-center gap-1 font-medium"
                        >
                          Get Free Key <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div>
                        <label className="block label-small text-zinc-500 dark:text-zinc-400 mb-1 font-medium">
                          Google Gemini API Key
                        </label>
                        {geminiKeyInfo.hasKey ? (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                              Saved (ends in {geminiKeyInfo.last4})
                            </span>
                            <button type="button" onClick={() => handleRemoveKey("gemini")} className="text-sm text-red-500 hover:text-red-600 font-semibold">Remove</button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Key className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-3 top-2.5" />
                              <input
                                type="password"
                                value={geminiApiKey}
                                onChange={(e) => {
                                  setGeminiApiKey(e.target.value);
                                  setTestResult(null);
                                  setSaveKeyError(null);
                                }}
                                placeholder="AIzaSy..."
                                className="w-full pl-9 pr-20 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 body-text font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-sm"
                              />
                              {geminiApiKey && (
                                <button
                                  type="button"
                                  disabled={isSavingKey === "gemini"}
                                  onClick={() => handleSaveKey("gemini")}
                                  className="absolute right-2 top-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-opacity"
                                >
                                  {isSavingKey === "gemini" ? "Saving..." : "Save"}
                                </button>
                              )}
                            </div>
                            {saveKeyError && saveKeyError.provider === "gemini" && (
                              <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                <X className="w-3 h-3 shrink-0" /> {saveKeyError.message}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="label-small text-zinc-500 dark:text-zinc-400 text-[11px]">
                                Direct Google Gemini 2.5 Flash execution.
                              </p>
                              {geminiApiKey && (
                                <button
                                  type="button"
                                  onClick={() => handleTestKey("gemini")}
                                  disabled={isTesting}
                                  className="px-2 py-1 bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-600/20 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                                >
                                  {isTesting &&
                                  testResult?.provider !== "openrouter"
                                    ? "Testing..."
                                    : "Test Key"}
                                </button>
                              )}
                            </div>
                            {testResult && testResult.provider === "gemini" && (
                              <p
                                className={`mt-2 text-xs font-medium flex items-center gap-1 ${testResult.success ? "text-emerald-600" : "text-red-500"}`}
                              >
                                {testResult.success ? (
                                  <>
                                    <Check className="w-3 h-3" /> API Key is working!
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> {testResult.message}
                                  </>
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-b-3xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl label-small text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="settings-form"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white label-small font-semibold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Preferences Saved!
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";

export type Theme =
  | "light"
  | "dark"
  | "red"
  | "catppuccin"
  | "onedark"
  | string;

const BUILTIN_THEME_IDS = ["light", "dark", "red", "catppuccin", "onedark"];

interface ThemeContextType {
  theme: string;
  resolvedTheme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  themes: string[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  themes: BUILTIN_THEME_IDS,
});

export function getPageType(
  pathname: string | null,
): "dashboard" | "landing" | "other" {
  if (!pathname || pathname === "/") return "landing";
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/trash") ||
    pathname.startsWith("/profile")
  ) {
    return "dashboard";
  }
  return "other";
}

function applyThemeToDom(theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  BUILTIN_THEME_IDS.forEach((t) => root.classList.remove(t));

  if (theme && theme !== "light") {
    root.classList.add(theme);
  } else {
    root.classList.add("light");
  }

  const isDark = ["dark", "catppuccin", "onedark"].includes(theme);
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const pathname = usePathname();
  const pageType = getPageType(pathname);

  const [dashboardTheme, setDashboardTheme] = useState<string>("light");
  const [landingTheme, setLandingTheme] = useState<"light" | "dark">("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedDashboard = localStorage.getItem("daydraft_dashboard_theme");
      if (storedDashboard) {
        setDashboardTheme(storedDashboard);
      }

      const storedLanding = localStorage.getItem("daydraft_landing_theme");
      if (storedLanding === "dark" || storedLanding === "light") {
        setLandingTheme(storedLanding);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "daydraft_landing_theme" &&
        (e.newValue === "light" || e.newValue === "dark")
      ) {
        setLandingTheme(e.newValue);
      }
      if (e.key === "daydraft_dashboard_theme" && e.newValue) {
        setDashboardTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const currentTheme = pageType === "dashboard" ? dashboardTheme : landingTheme;

  const isCurrentDark = ["dark", "catppuccin", "onedark"].includes(
    currentTheme,
  );
  const resolvedTheme = isCurrentDark ? "dark" : "light";

  useEffect(() => {
    applyThemeToDom(currentTheme);
  }, [currentTheme]);

  const setTheme = useCallback((newTheme: string) => {
    const currentPageType = getPageType(window.location.pathname);

    if (currentPageType === "dashboard") {
      setDashboardTheme(newTheme);
      try {
        localStorage.setItem("daydraft_dashboard_theme", newTheme);
      } catch {}
      applyThemeToDom(newTheme);
    } else {
      const sanitizedTheme: "light" | "dark" =
        newTheme === "dark" ? "dark" : "light";
      setLandingTheme(sanitizedTheme);
      try {
        localStorage.setItem("daydraft_landing_theme", sanitizedTheme);
      } catch {}
      applyThemeToDom(sanitizedTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const currentPageType = getPageType(
      typeof window !== "undefined" ? window.location.pathname : pathname,
    );

    if (currentPageType === "dashboard") {
      let customThemeIds: string[] = [];
      try {
        const storedUser = localStorage.getItem("daydraft_user_v1");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (Array.isArray(parsed.savedThemes)) {
            customThemeIds = parsed.savedThemes.map(
              (t: { id: string }) => t.id,
            );
          }
        }
      } catch {}
      const allThemeIds = [...BUILTIN_THEME_IDS, ...customThemeIds];
      const currentIndex = allThemeIds.indexOf(dashboardTheme);
      const nextIndex = (currentIndex + 1) % allThemeIds.length;
      setTheme(allThemeIds[nextIndex]);
    } else {
      const nextTheme = landingTheme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
    }
  }, [dashboardTheme, landingTheme, pathname, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: isMounted ? currentTheme : "light",
        resolvedTheme: isMounted ? resolvedTheme : "light",
        setTheme,
        toggleTheme,
        themes: BUILTIN_THEME_IDS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

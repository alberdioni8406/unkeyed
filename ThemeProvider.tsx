"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeId = "green" | "orange" | "red" | "sky" | "phantom";

const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "green", label: "Cyber Green", swatch: "#00e676" },
  { id: "orange", label: "Amber", swatch: "#ff6d00" },
  { id: "red", label: "Crimson", swatch: "#ff1744" },
  { id: "sky", label: "Sky Blue", swatch: "#00b0ff" },
  { id: "phantom", label: "Phantom", swatch: "#a78bfa" },
];

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("green");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("unkeyed-theme") as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      document.documentElement.setAttribute("data-theme", "green");
    }
    setMounted(true);
  }, []);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("unkeyed-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  // Avoid flash
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>{children}</div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

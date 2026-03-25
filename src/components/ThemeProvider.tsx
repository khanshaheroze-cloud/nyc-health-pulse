"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Apply theme to DOM — sets both data-theme attribute AND .dark class */
function applyTheme(t: Theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", t);
  if (t === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
  // Update theme-color meta tag for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", t === "dark" ? "#0F1410" : "#FAFAF7");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // On mount, read the current state (the inline script in <head> already set it)
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    const resolved: Theme = current === "dark" ? "dark" : "light";
    setTheme(resolved);
    // Ensure both mechanisms are in sync
    applyTheme(resolved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem("pulse-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

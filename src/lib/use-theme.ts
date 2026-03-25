"use client";

import { useSyncExternalStore } from "react";
import { tokens, type ThemeColors, type ThemeMode } from "./design-tokens";

/**
 * Reads the current theme from the `data-theme` attribute on <html>.
 * Falls back to system preference, then "light".
 */
function getTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(cb: () => void): () => void {
  // Watch for attribute changes on <html> (ThemeProvider toggles data-theme)
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Also listen for system preference changes
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);

  return () => {
    observer.disconnect();
    mq.removeEventListener("change", cb);
  };
}

/**
 * Returns the current theme mode and its color palette from design tokens.
 *
 * Usage:
 *   const { mode, colors } = useTheme();
 *   <div style={{ color: colors.textPrimary }}>
 */
export function useTheme(): { mode: ThemeMode; colors: ThemeColors } {
  const mode = useSyncExternalStore(subscribe, getTheme, () => "light" as const);
  return { mode, colors: tokens.colors[mode] };
}

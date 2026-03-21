"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pulse-saved-neighborhoods";

function getSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function setSaved(slugs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
}

interface Props {
  slug: string;
  size?: "sm" | "md";
}

export function SaveNeighborhoodButton({ slug, size = "md" }: Props) {
  const [saved, setSavedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSavedState(getSaved().includes(slug));
  }, [slug]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const current = getSaved();
    const next = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [...current, slug];
    setSaved(next);
    setSavedState(next.includes(slug));
    // notify other components on the same page
    window.dispatchEvent(new CustomEvent("pulse-saved-change"));
  }

  if (!mounted) return null;

  const isSmall = size === "sm";
  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Unsave neighborhood" : "Save neighborhood"}
      title={saved ? "Remove from saved" : "Save neighborhood"}
      className={`flex items-center gap-1 rounded-lg border transition-all ${
        isSmall ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
      } ${
        saved
          ? "bg-hp-yellow/10 border-hp-yellow/30 text-hp-yellow"
          : "bg-surface border-border text-dim hover:text-hp-yellow hover:border-hp-yellow/30"
      }`}
    >
      <span>{saved ? "★" : "☆"}</span>
      {size === "md" && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}

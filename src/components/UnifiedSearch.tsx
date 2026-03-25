"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { neighborhoods } from "@/lib/neighborhoodData";

type Mode = "neighborhood" | "building" | "food";

const MODES: { key: Mode; label: string; icon: string; placeholder: string }[] = [
  { key: "neighborhood", label: "Neighborhood", icon: "📍", placeholder: "Search 42 NYC neighborhoods…" },
  { key: "building",     label: "Building",     icon: "🏠", placeholder: "123 Main St, Brooklyn…" },
  { key: "food",         label: "Food",         icon: "🍎", placeholder: "Search 500K+ foods…" },
];

export function UnifiedSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("neighborhood");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof neighborhoods>([]);
  const [selIdx, setSelIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = MODES.find((m) => m.key === mode)!;

  // Neighborhood autocomplete
  useEffect(() => {
    if (mode !== "neighborhood" || query.length < 2) {
      setSuggestions([]);
      setSelIdx(-1);
      return;
    }
    const q = query.toLowerCase();
    const matches = neighborhoods
      .filter((n) => n.name.toLowerCase().includes(q) || n.borough.toLowerCase().includes(q))
      .slice(0, 6);
    setSuggestions(matches);
    setSelIdx(-1);
  }, [query, mode]);

  const submit = useCallback(() => {
    const q = query.trim();
    if (!q) return;

    if (mode === "neighborhood") {
      // Try exact match
      const match = neighborhoods.find(
        (n) => n.name.toLowerCase() === q.toLowerCase()
      );
      if (match) {
        router.push(`/neighborhood/${match.slug}`);
      } else if (suggestions.length > 0) {
        router.push(`/neighborhood/${suggestions[0].slug}`);
      } else {
        router.push(`/neighborhood?q=${encodeURIComponent(q)}`);
      }
    } else if (mode === "building") {
      router.push(`/building-health?q=${encodeURIComponent(q)}`);
    } else {
      router.push(`/eat-smart?q=${encodeURIComponent(q)}`);
    }
    setQuery("");
    setSuggestions([]);
  }, [query, mode, suggestions, router]);

  function handleKey(e: React.KeyboardEvent) {
    if (mode === "neighborhood" && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && selIdx >= 0) {
        e.preventDefault();
        router.push(`/neighborhood/${suggestions[selIdx].slug}`);
        setQuery("");
        setSuggestions([]);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="w-full">
      {/* Mode pills */}
      <div className="flex gap-1.5 mb-2.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold btn-press transition-all ${
              mode === m.key
                ? "bg-hp-green/15 text-hp-green border border-hp-green/30 shadow-[0_0_8px_rgba(16,185,129,.1)]"
                : "bg-bg border border-border text-dim hover:text-text hover:border-hp-green/20"
            }`}
          >
            <span className="text-[13px]">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Search input — pill-shaped */}
      <div className="relative" ref={listRef}>
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim text-sm pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder={current.placeholder}
          className="w-full bg-bg border border-border rounded-full pl-10 pr-4 py-3 text-[14px] text-text placeholder:text-muted focus-ring"
          autoComplete="off"
        />

        {/* Neighborhood suggestions dropdown */}
        {mode === "neighborhood" && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-surface border border-border rounded-xl overflow-hidden animate-scale-in" style={{ boxShadow: "var(--shadow-lg)" }}>
            {suggestions.map((n, i) => (
              <button
                key={n.slug}
                onClick={() => {
                  router.push(`/neighborhood/${n.slug}`);
                  setQuery("");
                  setSuggestions([]);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selIdx ? "bg-hp-green/10" : "hover:bg-surface-2"
                }`}
              >
                <span className="text-[13px] font-semibold text-text">{n.name}</span>
                <span className="text-[11px] text-muted">{n.borough}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

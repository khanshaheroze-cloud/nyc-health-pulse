"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { neighborhoods } from "@/lib/neighborhoodData";

const BOROUGH_COLORS: Record<string, string> = {
  Bronx:          "#f07070",
  Brooklyn:       "#5b9cf5",
  Manhattan:      "#a78bfa",
  Queens:         "#2dd4a0",
  "Staten Island":"#f59e42",
};

interface Props {
  placeholder?: string;
  autoFocus?: boolean;
  onSelect?: () => void;
}

export function NeighborhoodSearch({
  placeholder = "Search neighborhoods…",
  autoFocus = false,
  onSelect,
}: Props) {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [cursor, setCursor]   = useState(0);
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  const results = query.trim().length >= 1
    ? neighborhoods.filter(n =>
        n.name.toLowerCase().includes(query.toLowerCase()) ||
        n.borough.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => { setCursor(0); }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest("[data-search-root]")?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function go(slug: string) {
    setQuery("");
    setOpen(false);
    onSelect?.();
    router.push(`/neighborhood/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")      { e.preventDefault(); go(results[cursor].slug); }
    if (e.key === "Escape")     { setOpen(false); }
  }

  return (
    <div data-search-root className="relative w-full">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim text-sm pointer-events-none">🔍</span>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-text placeholder:text-muted outline-none focus:border-hp-blue/50 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dim text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          {results.map((n, i) => (
            <button
              key={n.slug}
              onMouseDown={() => go(n.slug)}
              onMouseEnter={() => setCursor(i)}
              className={[
                "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                cursor === i ? "bg-hp-blue/10" : "hover:bg-border/40",
              ].join(" ")}
            >
              <div>
                <p className="text-[12px] font-semibold text-text">{n.name}</p>
                <p className="text-[10px] text-muted">
                  Asthma ED {n.metrics.asthmaED}/10K · Life exp {n.metrics.lifeExp}y · Poverty {n.metrics.poverty}%
                </p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ml-3"
                style={{ background: BOROUGH_COLORS[n.borough] + "22", color: BOROUGH_COLORS[n.borough] }}
              >
                {n.borough}
              </span>
            </button>
          ))}
          <div className="px-4 py-1.5 border-t border-border">
            <p className="text-[10px] text-muted">↑↓ navigate · Enter to open · Esc to close</p>
          </div>
        </div>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-[12px] text-dim">No neighborhoods found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { neighborhoods } from "@/lib/neighborhoodData";
import { SubwayBullet, BOROUGH_LINE } from "./SubwayBullet";

const STORAGE_KEY = "pulse-saved-neighborhoods";

function getSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

export function SavedNeighborhoodsPanel() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  function refresh() {
    setSlugs(getSaved());
  }

  useEffect(() => {
    setMounted(true);
    refresh();
    window.addEventListener("pulse-saved-change", refresh);
    return () => window.removeEventListener("pulse-saved-change", refresh);
  }, []);

  if (!mounted || slugs.length === 0) return null;

  const saved = slugs
    .map(s => neighborhoods.find(n => n.slug === s))
    .filter(Boolean) as typeof neighborhoods;

  return (
    <div className="bg-surface border border-hp-yellow/20 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-hp-yellow text-[13px]">★</span>
          <h3 className="text-[13px] font-bold">Saved Neighborhoods</h3>
          <span className="text-[10px] text-dim">{saved.length} saved</span>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setSlugs([]);
            window.dispatchEvent(new CustomEvent("pulse-saved-change"));
          }}
          className="text-[10px] text-dim hover:text-text border border-border rounded px-2 py-0.5 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {saved.map(n => (
          <Link key={n.slug} href={`/neighborhood/${n.slug}`}>
            <div className="flex items-center gap-1.5 bg-border/30 hover:bg-hp-yellow/5 border border-transparent hover:border-hp-yellow/20 rounded-lg px-2.5 py-1.5 transition-all">
              <SubwayBullet line={BOROUGH_LINE[n.borough] ?? "S"} size={14} />
              <div>
                <p className="text-[11px] font-semibold leading-tight">{n.name}</p>
                <p className="text-[9px] text-dim">{n.borough}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

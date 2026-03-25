"use client";

import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ActivityItem {
  time: string;
  icon: string;
  type: string;
  borough: string;
  address: string;
}

/* Client-side fallback if API returns empty */
function clientSeed(): ActivityItem[] {
  const now = Date.now();
  return [
    { time: new Date(now - 3 * 60000).toISOString(), icon: "🐀", type: "Rodent", borough: "Brooklyn", address: "" },
    { time: new Date(now - 8 * 60000).toISOString(), icon: "🔊", type: "Noise: Construction", borough: "Manhattan", address: "" },
    { time: new Date(now - 15 * 60000).toISOString(), icon: "🔥", type: "HEAT/HOT WATER", borough: "Bronx", address: "" },
    { time: new Date(now - 22 * 60000).toISOString(), icon: "🏗️", type: "General Construction", borough: "Manhattan", address: "" },
    { time: new Date(now - 31 * 60000).toISOString(), icon: "🍽️", type: "Food Establishment", borough: "Queens", address: "" },
    { time: new Date(now - 38 * 60000).toISOString(), icon: "💧", type: "Water System", borough: "Brooklyn", address: "" },
    { time: new Date(now - 45 * 60000).toISOString(), icon: "🔊", type: "Noise: Loud Music", borough: "Queens", address: "" },
    { time: new Date(now - 52 * 60000).toISOString(), icon: "🐀", type: "Rodent", borough: "Manhattan", address: "" },
    { time: new Date(now - 60 * 60000).toISOString(), icon: "🌳", type: "Tree", borough: "Staten Island", address: "" },
    { time: new Date(now - 68 * 60000).toISOString(), icon: "🚧", type: "Street Condition", borough: "Bronx", address: "" },
  ];
}

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  Props — kept for backward compat, but no longer used              */
/* ------------------------------------------------------------------ */
interface LiveCounterStripProps {
  calls311?: number;
  ratSightings?: number;
  inspections?: number;
  covidTests?: number;
}

/* ------------------------------------------------------------------ */
/*  Component: Live 311 Activity Feed                                  */
/* ------------------------------------------------------------------ */
export function LiveCounterStrip(_props: LiveCounterStripProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/recent-311");
      if (!res.ok) throw new Error("not ok");
      const json = await res.json();
      if (Array.isArray(json.items) && json.items.length > 0) {
        setItems(json.items);
        setIsLive(json.live === true);
      } else {
        // API returned empty — use client seed
        setItems(clientSeed());
        setIsLive(false);
      }
    } catch {
      // Network error or bad response — use client seed
      setItems(clientSeed());
      setIsLive(false);
    }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    fetchItems();
    const id = setInterval(fetchItems, 300_000);
    return () => clearInterval(id);
  }, [fetchItems]);

  if (!loaded) {
    return (
      <section
        aria-label="Live NYC Activity"
        className="relative w-full overflow-hidden rounded-xl mb-3"
        style={{ background: "linear-gradient(135deg, #1a2e28 0%, #162622 50%, #1a2e28 100%)" }}
      >
        <div className="h-[40px] flex items-center gap-8 px-4 pl-16">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
            <span className="text-[9px] uppercase tracking-[.18em] font-bold" style={{ color: "rgba(45,212,160,.6)" }}>LIVE</span>
          </div>
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-3 rounded" style={{ background: "linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.06) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
              <div className="w-20 h-3 rounded" style={{ background: "linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.06) 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite` }} />
              <div className="w-14 h-3 rounded" style={{ background: "linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.06) 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.4s ease-in-out ${i * 0.3}s infinite` }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Duplicate items for seamless scroll loop
  const scrollItems = [...items, ...items];

  return (
    <section
      aria-label="Live NYC Activity"
      className="relative w-full overflow-hidden rounded-xl mb-3 group"
      style={{ background: "linear-gradient(135deg, #1a2e28 0%, #162622 50%, #1a2e28 100%)" }}
    >
      {/* Green accent line — static for performance */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] z-10"
        style={{
          background: "linear-gradient(90deg, transparent, #2dd4a0 40%, #2dd4a0 60%, transparent)",
        }}
      />

      {/* Label */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-3 pr-6"
        style={{ background: "linear-gradient(90deg, #1a2e28 60%, transparent)" }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
          <span className="text-[9px] uppercase tracking-[.18em] font-bold" style={{ color: "rgba(45,212,160,.8)" }}>
            {isLive ? "LIVE" : "311"}
          </span>
        </span>
      </div>

      {/* Scrolling feed */}
      <div className="overflow-hidden h-[40px] flex items-center pl-16">
        <div
          className="flex items-center gap-8 whitespace-nowrap group-hover:[animation-play-state:paused]"
          style={{
            animation: `tickerScroll ${items.length * 5}s linear infinite`,
          }}
        >
          {scrollItems.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,.35)" }}>
                {timeAgo(item.time)}
              </span>
              <span className="text-sm">{item.icon}</span>
              <span className="text-[11px] font-semibold text-white/80">{item.type}</span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,.4)" }}>
                {item.borough}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: "linear-gradient(270deg, #1a2e28, transparent)" }}
      />
    </section>
  );
}

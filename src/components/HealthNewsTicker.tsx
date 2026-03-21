"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "@/app/api/news/route";

export function HealthNewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-surface border border-border rounded-xl mb-4 overflow-hidden flex items-center h-10">
      {/* Fixed left label */}
      <div className="flex items-center gap-2 px-3 shrink-0 border-r border-border h-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hp-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-hp-red" />
        </span>
        <span className="text-[11px] font-semibold tracking-widest text-hp-red">LIVE</span>
        <span className="text-border text-xs ml-1">|</span>
      </div>

      {/* Scrolling area */}
      <div className="overflow-hidden flex-1 h-full flex items-center">
        {loading ? (
          <p className="text-[12px] text-dim px-4">Fetching headlines…</p>
        ) : items.length === 0 ? (
          <p className="text-[12px] text-dim px-4">Headlines unavailable</p>
        ) : (
          <div
            className="animate-ticker"
            style={{ willChange: "transform" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
            }}
          >
            {/* Duplicate items for seamless loop */}
            {[...items, ...items].map((item, i) => (
              <span key={i} className="inline-flex items-center">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap hover:opacity-80 transition-opacity text-[12px]"
                >
                  <span className={item.priority ? "text-hp-yellow" : "text-muted"}>
                    {item.source}
                  </span>
                  <span className="text-dim">·</span>
                  <span className="text-text">
                    {item.title.length > 90 ? item.title.slice(0, 90) + "…" : item.title}
                  </span>
                </a>
                <span className="mx-4 text-border">·</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

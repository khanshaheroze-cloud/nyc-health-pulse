"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "@/app/api/news/route";

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  try {
    const date = new Date(pubDate);
    const diffMs = Date.now() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return "< 1h ago";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  } catch {
    return "";
  }
}

export function HealthNewsFeed({ className }: { className?: string }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        const fetched = data.items ?? [];
        setItems(fetched);
        setLoading(false);
        if (fetched.length === 0) setError(true);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, []);

  return (
    <div className={`bg-surface border border-border rounded-xl p-4 flex flex-col gap-3${className ? ` ${className}` : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text">📰 NYC Health News</span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hp-green opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-hp-green" />
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-hp-green">LIVE</span>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="bg-border/40 animate-pulse rounded h-2.5 w-1/3" />
              <div className="bg-border/40 animate-pulse rounded h-3 w-full" />
              <div className="bg-border/40 animate-pulse rounded h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-[11px] text-dim">Headlines unavailable</p>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {items.slice(0, 8).map((item, i) => (
            <div
              key={i}
              className={`flex flex-col gap-0.5 ${item.priority ? "border-l-2 border-l-hp-yellow pl-2" : ""}`}
            >
              <div className="text-[10px] text-muted">
                <span className={item.priority ? "text-hp-yellow" : ""}>{item.source}</span>
                {item.pubDate && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{timeAgo(item.pubDate)}</span>
                  </>
                )}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] leading-snug line-clamp-2 text-text hover:text-hp-blue transition-colors"
              >
                {item.title}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-muted mt-auto pt-2 border-t border-border">
        Via Google News · refreshes every 30 min
      </div>
    </div>
  );
}

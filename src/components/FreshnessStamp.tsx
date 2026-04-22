"use client";

import { useEffect, useState } from "react";

interface FreshnessStampProps {
  lastUpdated: string;
  compact?: boolean;
}

function getRelativeTime(iso: string): { text: string; tier: "fresh" | "recent" | "stale" } {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return { text: "Just now", tier: "fresh" };

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { text: "Just now", tier: "fresh" };
  if (mins < 60) return { text: `${mins}m ago`, tier: mins < 5 ? "fresh" : "recent" };

  const hours = Math.floor(mins / 60);
  if (hours < 24) return { text: `${hours}h ago`, tier: hours < 1 ? "recent" : "stale" };

  const days = Math.floor(hours / 24);
  return { text: `${days}d ago`, tier: "stale" };
}

const DOT_COLORS = {
  fresh: "bg-hp-green",
  recent: "bg-hp-yellow",
  stale: "bg-hp-red",
} as const;

export function FreshnessStamp({ lastUpdated, compact }: FreshnessStampProps) {
  const [rel, setRel] = useState<ReturnType<typeof getRelativeTime> | null>(null);

  useEffect(() => {
    setRel(getRelativeTime(lastUpdated));
    const id = setInterval(() => setRel(getRelativeTime(lastUpdated)), 60000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  if (!rel) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-muted whitespace-nowrap">
      <span
        className={`w-1 h-1 rounded-full flex-shrink-0 ${DOT_COLORS[rel.tier]}${rel.tier === "fresh" ? " live-pulse" : ""}`}
      />
      {compact ? rel.text : `Updated ${rel.text}`}
    </span>
  );
}

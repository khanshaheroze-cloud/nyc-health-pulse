"use client";

import Link from "next/link";

const insights = [
  {
    headline: "The 12-Year Life Gap",
    stat: "88.8 vs 76.4 years across neighborhoods",
    href: "/neighborhood",
    color: "border-hp-blue",
  },
  {
    headline: "Air Quality Inequality",
    stat: "29% PM2.5 gap across boroughs",
    href: "/air-quality",
    color: "border-hp-green",
  },
  {
    headline: "NYC's Worst Rat Hotspots",
    stat: "Bushwick leads with 48 active infestations",
    href: "/environment",
    color: "border-hp-red",
  },
];

export function FeaturedInsights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.map((insight) => (
        <Link
          key={insight.href}
          href={insight.href}
          className={`block border-l-4 ${insight.color} bg-surface rounded-lg px-4 py-3 border border-border hover:shadow-md transition-shadow`}
        >
          <p className="font-semibold text-text text-sm leading-snug">
            {insight.headline}
          </p>
          <p className="text-dim text-xs mt-1">{insight.stat}</p>
          <span className="text-xs font-medium text-accent mt-2 inline-block">
            Explore &rarr;
          </span>
        </Link>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";

interface Props {
  name: string;
  slug: string;
  borough: string;
  metrics: {
    asthmaED: number;
    lifeExp: number;
    poverty: number;
    obesity: number;
  };
}

export function ShareNeighborhood({ name, slug, borough, metrics }: Props) {
  const [copied, setCopied] = useState(false);

  const url = `https://pulsenyc.app/neighborhood/${slug}`;
  const text = `${name}, ${borough} — Asthma ED: ${metrics.asthmaED}/10K · Life Exp: ${metrics.lifeExp}y · Poverty: ${metrics.poverty}% · Obesity: ${metrics.obesity}%`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} Health Profile — Pulse NYC`, text, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-dim bg-surface border border-border rounded-lg hover:border-hp-blue/40 hover:text-hp-blue transition-all"
      title="Share this neighborhood"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}

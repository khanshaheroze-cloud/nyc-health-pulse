import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new on Pulse NYC — feature updates, new data sources, and improvements.",
};
import { SectionShell } from "@/components/SectionShell";

const ENTRIES = [
  {
    date: "Mar 15, 2026",
    title: "Maternal Health Section + Wastewater Surveillance",
    items: [
      "New Maternal Health page — pregnancy-related mortality by cause and race, C-section rates by borough, infant mortality disparities",
      "COVID wastewater surveillance chart — SARS-CoV-2 viral load from NYC sewersheds (CDC NWSS)",
      "Flu wastewater chart — Influenza A viral signal as an early-warning indicator",
      "Youth Risk Behavior Survey (YRBS) trend chart on Nutrition page — obesity, soda, physical activity",
      "Accessibility: dash patterns on all line charts for colorblind users, varied opacity on bar charts",
      "Share button on neighborhood profiles — Web Share API with clipboard fallback",
    ],
  },
  {
    date: "Mar 10, 2026",
    title: "Email Digest + Domain Launch",
    items: [
      "Custom domain: pulsenyc.app is now live",
      "Daily & weekly email digest — choose your frequency at signup",
      "Vercel cron jobs for automated email delivery (Mon 1 PM weekly, daily at 1 PM)",
      "Light wellness theme for email digest HTML",
    ],
  },
  {
    date: "Mar 5, 2026",
    title: "Neighborhood Profiles + Live Data Expansion",
    items: [
      "42 UHF neighborhood health profiles with save & compare features",
      "CDC PLACES census tract choropleth map — 7 health measures at tract level",
      "Heat Vulnerability Index by neighborhood (NYC DOHMH)",
      "Blood lead screening by neighborhood (children <6 with BLL ≥5 μg/dL)",
      "HIV surveillance by neighborhood from NYC DOHMH",
    ],
  },
  {
    date: "Feb 2026",
    title: "Core Platform Launch",
    items: [
      "9 health topic sections: Air Quality, COVID, Flu, Food Safety, Environment, Chronic Disease, Overdose, Nutrition, Demographics",
      "Live data from 25+ public APIs — NYC DOHMH, CDC, Census ACS, EPA, NY State DOH",
      "Real-time health insights ticker with status indicators",
      "Google News health feed integration",
      "Neighborhood search with autocomplete",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <SectionShell
      icon="📋"
      title="Changelog"
      description="What's new on Pulse NYC — updates ship continuously"
      accentColor="rgba(91,156,245,.12)"
    >
      <div className="space-y-6">
        {ENTRIES.map((entry) => (
          <div key={entry.date} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold text-dim bg-bg px-2.5 py-1 rounded-full border border-border">
                {entry.date}
              </span>
              <h3 className="text-sm font-bold">{entry.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {entry.items.map((item, i) => (
                <li key={i} className="text-xs text-dim leading-relaxed flex gap-2">
                  <span className="text-hp-green mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

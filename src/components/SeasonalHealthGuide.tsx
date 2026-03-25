"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SeasonalTip = {
  icon: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

type SeasonConfig = {
  label: string;
  accent: string;      // Tailwind border/text color class
  accentBg: string;    // Tailwind background tint
  tips: SeasonalTip[];
};

const SEASONS: Record<string, SeasonConfig> = {
  spring: {
    label: "Spring",
    accent: "text-hp-green",
    accentBg: "bg-hp-green/8",
    tips: [
      {
        icon: "\u{1F33F}",
        title: "Tree pollen season is here",
        description: "Oak, birch, and maple peak in April\u2013May. Check your forecast.",
        href: "/air-quality",
      },
      {
        icon: "\u{1F32C}\uFE0F",
        title: "Spring winds carry particulates",
        description: "Check AQI before outdoor exercise.",
        href: "/air-quality",
      },
      {
        icon: "\u{1F96C}",
        title: "Farmers markets reopening",
        description: "Find markets near you, many accept SNAP/EBT.",
        href: "/nutrition",
      },
      {
        icon: "\u{1F489}",
        title: "Stay current on vaccines",
        description: "COVID variants can surge in spring.",
        href: "/covid",
      },
    ],
  },
  summer: {
    label: "Summer",
    accent: "text-hp-orange",
    accentBg: "bg-hp-orange/8",
    tips: [
      {
        icon: "\u2600\uFE0F",
        title: "Heat advisory days ahead",
        description: "Know your cooling center. Call 311 for locations.",
        href: "/environment",
      },
      {
        icon: "\u{1F3D6}\uFE0F",
        title: "Beach season is open",
        description: "DOHMH tests beaches weekly. Check results.",
        href: "/environment",
      },
      {
        icon: "\u{1F3CA}",
        title: "Free outdoor pools",
        description: "50+ free pools open Memorial Day \u2013 Labor Day.",
        href: "https://www.nycgovparks.org/facilities/outdoor-pools",
        external: true,
      },
      {
        icon: "\u{1F32C}\uFE0F",
        title: "Summer ozone spikes",
        description: "Sensitive groups should limit afternoon outdoor activity.",
        href: "/air-quality",
      },
    ],
  },
  fall: {
    label: "Fall",
    accent: "text-hp-yellow",
    accentBg: "bg-hp-yellow/8",
    tips: [
      {
        icon: "\u{1F489}",
        title: "Get your flu shot",
        description: "Free at H+H clinics. No insurance needed.",
        href: "/flu",
      },
      {
        icon: "\u{1F33E}",
        title: "Ragweed pollen peaks",
        description: "Take antihistamines before symptoms start.",
        href: "/air-quality",
      },
      {
        icon: "\u{1F3EB}",
        title: "Back to school",
        description: "Check vaccination requirements for your child.",
        href: "/sources",
      },
      {
        icon: "\u{1F525}",
        title: "Heating season starts Oct 1",
        description: "Landlords must provide heat 68\u00B0F+ daytime. Report violations: 311.",
        href: "/environment",
      },
    ],
  },
  winter: {
    label: "Winter",
    accent: "text-hp-blue",
    accentBg: "bg-hp-blue/8",
    tips: [
      {
        icon: "\u{1F9A0}",
        title: "Respiratory season",
        description: "Flu + COVID + RSV. Get vaccinated, stay home if sick.",
        href: "/flu",
      },
      {
        icon: "\u2744\uFE0F",
        title: "No heat? Call 311",
        description: "NYC requires heat Oct 1\u2013May 31. Report immediately.",
        href: "/environment",
      },
      {
        icon: "\u{1F9E0}",
        title: "Seasonal depression",
        description: "Affects 10\u201320% of adults. NYC Well: 888-692-9355",
        href: "/chronic-disease",
      },
      {
        icon: "\u26A0\uFE0F",
        title: "Carbon monoxide safety",
        description: "Never use a stove for heating. Install CO detectors.",
        href: "/environment",
      },
    ],
  },
};

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return "spring"; // Mar-May (0-indexed: 2-4)
  if (month >= 5 && month <= 7) return "summer"; // Jun-Aug
  if (month >= 8 && month <= 10) return "fall";  // Sep-Nov
  return "winter";                                 // Dec-Feb
}

export function SeasonalHealthGuide() {
  // Use stable defaults for SSR, update on client to avoid hydration mismatch
  const [month, setMonth] = useState(2); // March default
  const [year, setYear] = useState(2026);
  useEffect(() => {
    const now = new Date();
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  }, []);
  const seasonKey = getSeason(month);
  const season = SEASONS[seasonKey];

  return (
    <div
      className={`${season.accentBg} border border-border rounded-xl p-4 mb-4`}
    >
      <h3 className="text-[13px] font-bold text-text mb-3">
        Seasonal Health Guide{" "}
        <span className={`${season.accent} font-semibold`}>
          &middot; {season.label} {year}
        </span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {season.tips.map((tip) => {
          const content = (
            <div className="flex items-start gap-2.5 group bg-surface/60 rounded-lg px-3 py-2.5 hover:bg-surface transition-colors">
              <span className="text-[18px] leading-none mt-0.5 shrink-0">
                {tip.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-text leading-tight">
                  {tip.title}
                </p>
                <p className="text-[11px] text-dim leading-snug mt-0.5">
                  {tip.description}
                </p>
              </div>
              <span
                className={`${season.accent} text-[13px] opacity-50 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0`}
              >
                &rarr;
              </span>
            </div>
          );

          if (tip.external) {
            return (
              <a
                key={tip.title}
                href={tip.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={tip.title} href={tip.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

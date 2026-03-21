"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type InsightCard = {
  id: string;
  headline: string;
  stat: string;
  detail: string;
  comparison?: string;
  source: string;
  color: string;
  bgGradient: string;
  link: string;
};

const CARDS: InsightCard[] = [
  {
    id: "rat-hotspots",
    headline: "NYC's Worst Rat Hotspots",
    stat: "Bushwick leads with 48 active infestations",
    detail: "East New York (41), Bed-Stuy (38), and Harlem (35) round out the top 4. All confirmed via DOHMH rodent inspections.",
    source: "NYC 311 + DOHMH · 2024",
    color: "text-hp-red",
    bgGradient: "linear-gradient(135deg, rgba(240,112,112,0.08) 0%, rgba(240,112,112,0.02) 100%)",
    link: "/environment",
  },
  {
    id: "pm25-gap",
    headline: "Air Quality Inequality",
    stat: "29% PM2.5 gap across boroughs",
    detail: "Chelsea & Greenwich Village breathe 7.9 μg/m³ of fine particles — while Willowbrook on Staten Island sees just 6.1 μg/m³. Same city, different lungs.",
    comparison: "Manhattan: 7.9 μg/m³  vs  Staten Island: 6.1 μg/m³",
    source: "NYC Community Air Survey (NYCCAS)",
    color: "text-hp-green",
    bgGradient: "linear-gradient(135deg, rgba(45,212,160,0.08) 0%, rgba(45,212,160,0.02) 100%)",
    link: "/air-quality",
  },
  {
    id: "life-expectancy",
    headline: "The 12-Year Life Gap",
    stat: "88.8 vs 76.4 years",
    detail: "A baby born in Gramercy Park can expect to live 12.4 years longer than one born in Hunts Point / Mott Haven — just 10 miles apart.",
    comparison: "Gramercy Park: 88.8y  vs  Hunts Point: 76.4y",
    source: "NYC DOHMH Community Health Profiles · 2019",
    color: "text-hp-blue",
    bgGradient: "linear-gradient(135deg, rgba(91,156,245,0.08) 0%, rgba(91,156,245,0.02) 100%)",
    link: "/neighborhood",
  },
  {
    id: "overdose-divide",
    headline: "NYC's Overdose Divide",
    stat: "11x higher in the South Bronx",
    detail: "Hunts Point / Mott Haven sees 134.8 overdose deaths per 100K — while Greenwich Village / SoHo sees 12.2. Fentanyl drives ~80% of deaths citywide.",
    comparison: "Hunts Point: 134.8  vs  Greenwich Village: 12.2 per 100K",
    source: "NYC DOHMH Epi Data Brief · 2023",
    color: "text-hp-purple",
    bgGradient: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.02) 100%)",
    link: "/overdose",
  },
  {
    id: "asthma-disparity",
    headline: "Asthma ER Visits: 9x Disparity",
    stat: "163.8 vs 18.4 per 10K",
    detail: "Hunts Point has the highest asthma ER rate in NYC. South Beach / Tottenville has the lowest. Poverty, housing quality, and traffic exposure drive the gap.",
    comparison: "Hunts Point: 163.8  vs  South Beach: 18.4 per 10K",
    source: "NYC DOHMH Community Health Profiles · 2021",
    color: "text-hp-orange",
    bgGradient: "linear-gradient(135deg, rgba(245,158,66,0.08) 0%, rgba(245,158,66,0.02) 100%)",
    link: "/chronic-disease",
  },
  {
    id: "maternal-mortality",
    headline: "Maternal Mortality: 8x Racial Gap",
    stat: "Black women die at 8–12x the rate of white women",
    detail: "In NYC, non-Hispanic Black women face pregnancy-related death rates 8 to 12 times higher than white and Asian women. Structural racism and unequal access to prenatal care drive this crisis.",
    comparison: "Black non-Latina: 51+ deaths  vs  White non-Latina: ~10 deaths (2016–2017)",
    source: "NYC DOHMH Pregnancy-Associated Mortality · 2016–2017",
    color: "text-hp-pink",
    bgGradient: "linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(244,114,182,0.02) 100%)",
    link: "/maternal-health",
  },
  {
    id: "mental-health",
    headline: "1 in 5 NYC Adults Report Depression",
    stat: "20.4% citywide · even higher in the Bronx",
    detail: "Mental health is the #1 health concern in NYC polling, yet access to care varies wildly. If you or someone you know is struggling: call 988 (Suicide & Crisis Lifeline) or text \"WELL\" to 65173 for NYC Well.",
    source: "CDC PLACES · NYC Well",
    color: "text-hp-cyan",
    bgGradient: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)",
    link: "/chronic-disease",
  },
  {
    id: "water-safety",
    headline: "NYC Tap Water: Among Safest in the US",
    stat: "99.9% of samples are coliform-free",
    detail: "NYC's tap water comes from a protected watershed in the Catskills — one of only 4 US cities with unfiltered surface water. DEP tests thousands of samples monthly across all 5 boroughs.",
    source: "NYC DEP Water Quality · Live",
    color: "text-hp-cyan",
    bgGradient: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)",
    link: "/environment",
  },
  {
    id: "life-gap-13",
    headline: "The 13-Year Life Expectancy Gap",
    stat: "Upper East Side: 89.4 vs Hunts Point: 76.4",
    detail: "Residents of the Upper East Side live 13 years longer on average than those in Hunts Point — just a few subway stops apart. Income, housing, and healthcare access drive the gap.",
    comparison: "Upper East Side: 89.4y  vs  Hunts Point: 76.4y",
    source: "NYC DOHMH Vital Statistics · 2019",
    color: "text-hp-blue",
    bgGradient: "linear-gradient(135deg, rgba(91,156,245,0.08) 0%, rgba(91,156,245,0.02) 100%)",
    link: "/neighborhood",
  },
  {
    id: "bronx-asthma-3x",
    headline: "Bronx Has 3x the Asthma ER Visits",
    stat: "The Bronx sees 3x more asthma emergencies per capita than Manhattan",
    detail: "Air quality, housing conditions, and proximity to highways drive asthma disparities. The South Bronx is especially affected — Hunts Point leads at 163.8 per 10K.",
    source: "NYC DOHMH · 2021",
    color: "text-hp-orange",
    bgGradient: "linear-gradient(135deg, rgba(245,158,66,0.08) 0%, rgba(245,158,66,0.02) 100%)",
    link: "/chronic-disease",
  },
  {
    id: "chelsea-worst-air",
    headline: "Chelsea-Clinton: NYC's Worst Air",
    stat: "PM2.5 at 8.08 μg/m³ — 62% above WHO guideline",
    detail: "Traffic density and building emissions make Chelsea-Clinton the most polluted neighborhood in NYC. The WHO recommends 5 μg/m³ max. Most NYC neighborhoods exceed that.",
    source: "NYCCAS · 2023",
    color: "text-hp-green",
    bgGradient: "linear-gradient(135deg, rgba(45,212,160,0.08) 0%, rgba(45,212,160,0.02) 100%)",
    link: "/air-quality",
  },
  {
    id: "obesity-bronx",
    headline: "1 in 3 Bronx Adults is Obese",
    stat: "33.7% obesity rate — highest of any borough",
    detail: "Citywide obesity is ~26%, but the Bronx leads at 33.7%. Food deserts, limited walkability, and lower incomes are key factors. Rates vary dramatically by neighborhood.",
    source: "CDC PLACES · 2023",
    color: "text-hp-yellow",
    bgGradient: "linear-gradient(135deg, rgba(213,119,6,0.08) 0%, rgba(213,119,6,0.02) 100%)",
    link: "/chronic-disease",
  },
  {
    id: "fentanyl-80pct",
    headline: "Fentanyl Drives 80% of Overdose Deaths",
    stat: "OD deaths dropped 28% in 2024 — but fentanyl persists",
    detail: "NYC saw ~2,235 overdose deaths in 2024, down from a 2023 peak. Fentanyl remains the primary driver. Free naloxone (Narcan) is available at any NYC pharmacy without a prescription.",
    source: "NYC DOHMH · 2024",
    color: "text-hp-purple",
    bgGradient: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.02) 100%)",
    link: "/overdose",
  },
  {
    id: "water-cleaner-bottled",
    headline: "NYC Tap Water: Cleaner Than Bottled",
    stat: "100% of recent DEP samples passed coliform testing",
    detail: "NYC's Catskill/Delaware watershed is so clean the city is one of only 4 in the US exempted from filtration requirements. Save money — skip the bottles.",
    source: "NYC DEP · Live",
    color: "text-hp-cyan",
    bgGradient: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)",
    link: "/environment",
  },
  {
    id: "restaurant-violations",
    headline: "Restaurant Violations: Are You Eating Safe?",
    stat: "~3,000 critical violations flagged every month",
    detail: "Wrong food temps, pest evidence, and bare-hand contact are the most common critical violations. Always check a restaurant's letter grade — it's posted at the entrance.",
    source: "NYC DOHMH Inspections · Live",
    color: "text-hp-purple",
    bgGradient: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.02) 100%)",
    link: "/food-safety",
  },
  {
    id: "quietest-neighborhood",
    headline: "NYC's Quietest Neighborhood",
    stat: "South Beach/Tottenville: just 25 noise complaints/week",
    detail: "While Manhattan averages 399 noise complaints per week, South Beach/Tottenville on Staten Island barely registers. Construction, nightlife, and traffic drive the gap.",
    comparison: "South Beach/Tottenville: 25/wk  vs  Manhattan avg: 399/wk",
    source: "NYC 311 · Live",
    color: "text-hp-green",
    bgGradient: "linear-gradient(135deg, rgba(45,212,160,0.08) 0%, rgba(45,212,160,0.02) 100%)",
    link: "/environment",
  },
  {
    id: "traffic-fatalities-2025",
    headline: "206 Traffic Deaths in 2025",
    stat: "Lowest in NYC history — but still 206 too many",
    detail: "NYC's Vision Zero program hit a milestone in 2025 with the fewest traffic fatalities ever recorded. Pedestrians and cyclists remain the most vulnerable. Speed cameras and redesigned intersections are driving the decline.",
    source: "NYC DOT Vision Zero · 2025",
    color: "text-hp-red",
    bgGradient: "linear-gradient(135deg, rgba(240,112,112,0.08) 0%, rgba(240,112,112,0.02) 100%)",
    link: "/safety",
  },
  {
    id: "tap-water-testing",
    headline: "NYC Tap Water: 1,000+ Tests/Month",
    stat: "Zero coliform failures in months",
    detail: "NYC's DEP tests tap water over 1,000 times per month across all five boroughs. The Catskill/Delaware watershed system is so pristine that NYC is one of only 4 US cities exempt from filtration. Your tap beats most bottles.",
    source: "NYC DEP Water Quality · Live",
    color: "text-hp-cyan",
    bgGradient: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)",
    link: "/environment",
  },
  {
    id: "bronx-food-desert",
    headline: "1 in 4 Bronx Kids Live in a Food Desert",
    stat: "No supermarket within half a mile",
    detail: "Food deserts — areas without a full-service grocery store within 0.5 miles — are concentrated in the South Bronx. Corner bodegas fill the gap, but fresh produce is limited and expensive. Childhood obesity rates track closely with food access.",
    source: "USDA Food Access Research Atlas · 2019",
    color: "text-hp-orange",
    bgGradient: "linear-gradient(135deg, rgba(245,158,66,0.08) 0%, rgba(245,158,66,0.02) 100%)",
    link: "/nutrition",
  },
  {
    id: "bronx-asthma-air",
    headline: "Bronx: 3x Asthma ER Visits + 50% Worse Air",
    stat: "The Bronx has triple the asthma ER rate of Staten Island",
    detail: "The Cross Bronx Expressway and heavy truck traffic pump pollutants into South Bronx neighborhoods daily. PM2.5 levels run 50% higher than Staten Island — and asthma ER visits are 3x the rate. Kids are hit hardest.",
    comparison: "Bronx asthma ER: 3x Staten Island  |  Bronx PM2.5: 50% higher",
    source: "NYC DOHMH + NYCCAS",
    color: "text-hp-orange",
    bgGradient: "linear-gradient(135deg, rgba(245,158,66,0.08) 0%, rgba(245,158,66,0.02) 100%)",
    link: "/air-quality",
  },
  {
    id: "naloxone-drop",
    headline: "Free Naloxone → 28% Drop in OD Deaths",
    stat: "Any NYC pharmacy — no prescription needed",
    detail: "NYC made naloxone (Narcan) available for free at every pharmacy in the city, no prescription required. Combined with expanded harm reduction programs, overdose deaths fell 28% in 2024. One dose can reverse an opioid overdose in minutes.",
    source: "NYC DOHMH · 2024",
    color: "text-hp-purple",
    bgGradient: "linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(167,139,250,0.02) 100%)",
    link: "/overdose",
  },
  {
    id: "maternal-racial-gap",
    headline: "8–12x Maternal Death Rate for Black Mothers",
    stat: "Non-Hispanic Black mothers face the highest risk in NYC",
    detail: "Structural racism, implicit bias in healthcare, and unequal access to prenatal care drive a staggering disparity: Black mothers in NYC die at 8 to 12 times the rate of white mothers during pregnancy and childbirth.",
    comparison: "Black non-Latina: 8–12x  vs  White non-Latina: baseline",
    source: "NYC DOHMH Pregnancy-Associated Mortality",
    color: "text-hp-pink",
    bgGradient: "linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(244,114,182,0.02) 100%)",
    link: "/maternal-health",
  },
  {
    id: "ues-vs-hunts-point",
    headline: "7 Miles Apart, 13 Years of Life Apart",
    stat: "Upper East Side: 89.4y vs Hunts Point: 76.4y",
    detail: "The Upper East Side and Hunts Point are just 7 miles and a few subway stops apart — but residents face a 13-year gap in life expectancy. Income, air quality, food access, and healthcare all play a role.",
    comparison: "Upper East Side: 89.4 years  vs  Hunts Point: 76.4 years",
    source: "NYC DOHMH Community Health Profiles · 2019",
    color: "text-hp-blue",
    bgGradient: "linear-gradient(135deg, rgba(91,156,245,0.08) 0%, rgba(91,156,245,0.02) 100%)",
    link: "/neighborhood",
  },
  {
    id: "heat-complaints-record",
    headline: "250,000+ Heat Complaints Last Winter",
    stat: "An all-time record for NYC tenants",
    detail: "Over a quarter million NYC tenants filed heat and hot water complaints last winter — a new record. Landlords are required to maintain 68°F during the day and 62°F at night from October through May. Call 311 to report violations.",
    source: "NYC 311 + HPD · 2025",
    color: "text-hp-red",
    bgGradient: "linear-gradient(135deg, rgba(240,112,112,0.08) 0%, rgba(240,112,112,0.02) 100%)",
    link: "/building-health",
  },
  {
    id: "citi-bike-calories",
    headline: "Your Citi Bike Commute Burns 250 Calories",
    stat: "And saves $2.90 vs. the subway each ride",
    detail: "A 30-minute Citi Bike ride burns roughly 250 calories and costs less than a single subway swipe. With 2,000+ stations across NYC, it's exercise, transportation, and savings rolled into one.",
    comparison: "Citi Bike: ~250 cal burned + $0  vs  Subway: 0 cal + $2.90",
    source: "Citi Bike · MTA · Health estimates",
    color: "text-hp-green",
    bgGradient: "linear-gradient(135deg, rgba(45,212,160,0.08) 0%, rgba(45,212,160,0.02) 100%)",
    link: "/nutrition",
  },
];

export function ShareableInsights() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [progressActive, setProgressActive] = useState(false);
  const [slideDir, setSlideDir] = useState<"none" | "left" | "right">("none");
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback((direction: "left" | "right") => {
    setSlideDir(direction);
    setTimeout(() => {
      setCurrent((c) =>
        direction === "left"
          ? (c + 1) % CARDS.length
          : (c - 1 + CARDS.length) % CARDS.length
      );
      setProgressKey((k) => k + 1);
      setSlideDir("none");
    }, 300);
  }, []);

  const next = useCallback(() => advance("left"), [advance]);
  const prev = useCallback(() => advance("right"), [advance]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  // Kick progress bar fill after mount / each reset
  useEffect(() => {
    setProgressActive(false);
    const raf = requestAnimationFrame(() => setProgressActive(true));
    return () => cancelAnimationFrame(raf);
  }, [progressKey, isPaused]);

  const pauseInteraction = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setIsPaused(true);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      setIsPaused(false);
      setProgressKey((k) => k + 1);
    }, 3000);
  }, []);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const card = CARDS[current];

  async function handleShare() {
    const text = `${card.headline}: ${card.stat}\n\n${card.detail}${card.comparison ? `\n${card.comparison}` : ""}\n\nSource: ${card.source}\n\nExplore more at pulsenyc.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: card.headline, text, url: `https://pulsenyc.app${card.link}` });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById("share-btn");
      if (btn) { btn.textContent = "Copied!"; setTimeout(() => { btn.textContent = "Share"; }, 2000); }
    }
  }

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 pb-0 mb-4 relative overflow-hidden"
      onMouseEnter={pauseInteraction}
      onMouseLeave={scheduleResume}
      onTouchStart={pauseInteraction}
      onTouchEnd={scheduleResume}
    >
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: card.bgGradient }} />

      {/* Slide container */}
      <div className="relative overflow-hidden">
        <div
          className="transition-transform duration-300 ease-in-out"
          style={{
            transform:
              slideDir === "left"
                ? "translateX(-100%)"
                : slideDir === "right"
                  ? "translateX(100%)"
                  : "translateX(0)",
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-[2px] uppercase text-muted">NYC Health Insight</span>
              <span className="text-[9px] text-muted">
                {current + 1}/{CARDS.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prev}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-border text-muted hover:text-text hover:border-dim transition-colors text-xs"
                aria-label="Previous insight"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="w-6 h-6 flex items-center justify-center rounded-md border border-border text-muted hover:text-text hover:border-dim transition-colors text-xs"
                aria-label="Next insight"
              >
                ›
              </button>
            </div>
          </div>

          {/* Content */}
          <h3 className={`text-[15px] font-bold mb-1 ${card.color}`}>{card.headline}</h3>
          <p className="text-[20px] font-display font-black text-text mb-2" style={{ lineHeight: 1.2 }}>
            {card.stat}
          </p>
          <p className="text-[12px] text-dim leading-relaxed mb-2">{card.detail}</p>

          {card.comparison && (
            <div className="bg-bg/60 border border-border rounded-lg px-3 py-2 mb-3">
              <p className="text-[11px] font-mono text-dim">{card.comparison}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[9px] text-muted">{card.source}</p>
            <div className="flex items-center gap-2">
              <a
                href={card.link}
                className="text-[10px] font-semibold text-dim hover:text-text border border-border rounded-md px-2 py-0.5 transition-colors"
              >
                Explore →
              </a>
              <button
                id="share-btn"
                onClick={handleShare}
                className="text-[10px] font-semibold text-dim hover:text-text border border-border rounded-md px-2 py-0.5 transition-colors"
              >
                Share
              </button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-3 pb-3">
            {CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setProgressKey((k) => k + 1); }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? "w-4 bg-dim" : "w-1.5 bg-border hover:bg-muted"
                }`}
                aria-label={`Go to insight ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-[2px] bg-border/40 -mx-5">
        <div
          key={progressKey}
          className="absolute inset-y-0 left-0 bg-hp-green rounded-r-full"
          style={{
            width: progressActive && !isPaused ? "100%" : "0%",
            transition: progressActive && !isPaused ? "width 8s linear" : "none",
          }}
        />
      </div>
    </div>
  );
}

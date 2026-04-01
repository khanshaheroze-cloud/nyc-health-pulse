import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NYC Street Safety — Vision Zero Crash Data",
  description:
    "Traffic crash data for NYC: collisions, injuries, and fatalities by borough. Live data from NYPD Motor Vehicle Collisions. Vision Zero progress tracker.",
};

import { SectionShell } from "@/components/SectionShell";
import { ScrollReveal } from "@/components/ScrollReveal";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import {
  CrashesByBoroughChart,
  CrashTrendChart,
  ContributingFactorsChart,
} from "@/components/SafetyCharts";

interface BoroughCrash {
  borough: string;
  crashes: number;
  injured: number;
  killed: number;
  pedInjured: number;
  cyclistInjured: number;
}

interface CrashFactor {
  factor: string;
  count: number;
}

interface MonthlyTrend {
  yr: number;
  mo: number;
  label: string;
  crashes: number;
  killed: number;
}

interface CrashData {
  byBorough: BoroughCrash[];
  topFactors: CrashFactor[];
  monthlyTrend: MonthlyTrend[];
}

async function fetchCrashDataDirect(): Promise<CrashData> {
  const BASE = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const MONTH_LABELS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  try {
    const fetchOpts = { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) };
    const [boroughRes, factorsRes, trendRes] = await Promise.all([
      fetch(`${BASE}?$select=borough, count(*) as crashes, sum(number_of_persons_injured) as injured, sum(number_of_persons_killed) as killed, sum(number_of_pedestrians_injured) as ped_injured, sum(number_of_cyclist_injured) as cyclist_injured&$where=crash_date > '${fmt(twelveMonthsAgo)}' AND borough IS NOT NULL AND borough != ''&$group=borough&$order=crashes DESC`, fetchOpts),
      fetch(`${BASE}?$select=contributing_factor_vehicle_1 as factor, count(*) as cnt&$where=crash_date > '${fmt(twelveMonthsAgo)}' AND contributing_factor_vehicle_1 != 'Unspecified'&$group=contributing_factor_vehicle_1&$order=cnt DESC&$limit=8`, fetchOpts),
      fetch(`${BASE}?$select=date_extract_y(crash_date) as yr, date_extract_m(crash_date) as mo, count(*) as crashes, sum(number_of_persons_killed) as killed&$where=crash_date > '${fmt(twoYearsAgo)}'&$group=yr,mo&$order=yr,mo`, fetchOpts),
    ]);

    const boroughRaw = boroughRes.ok ? await boroughRes.json() as { borough: string; crashes: string; injured: string; killed: string; ped_injured: string; cyclist_injured: string }[] : [];
    const factorsRaw = factorsRes.ok ? await factorsRes.json() as { factor: string; cnt: string }[] : [];
    const trendRaw = trendRes.ok ? await trendRes.json() as { yr: string; mo: string; crashes: string; killed: string }[] : [];

    return {
      byBorough: boroughRaw.map((r) => ({
        borough: r.borough.charAt(0) + r.borough.slice(1).toLowerCase(),
        crashes: parseInt(r.crashes) || 0,
        injured: parseInt(r.injured) || 0,
        killed: parseInt(r.killed) || 0,
        pedInjured: parseInt(r.ped_injured) || 0,
        cyclistInjured: parseInt(r.cyclist_injured) || 0,
      })),
      topFactors: factorsRaw.map((r) => ({
        factor: r.factor,
        count: parseInt(r.cnt) || 0,
      })),
      monthlyTrend: trendRaw.map((r) => ({
        yr: parseInt(r.yr),
        mo: parseInt(r.mo),
        label: `${MONTH_LABELS[parseInt(r.mo)]} '${String(parseInt(r.yr)).slice(2)}`,
        crashes: parseInt(r.crashes) || 0,
        killed: parseInt(r.killed) || 0,
      })),
    };
  } catch {
    return { byBorough: [], topFactors: [], monthlyTrend: [] };
  }
}

export default async function SafetyPage() {
  const { byBorough, topFactors, monthlyTrend } = await fetchCrashDataDirect();

  // Aggregate KPIs
  const totalCrashes = byBorough.reduce((s, b) => s + b.crashes, 0);
  const totalInjured = byBorough.reduce((s, b) => s + b.injured, 0);
  const totalKilled = byBorough.reduce((s, b) => s + b.killed, 0);
  const totalPedInjured = byBorough.reduce((s, b) => s + b.pedInjured, 0);

  const hasData = byBorough.length > 0;

  return (
    <SectionShell
      icon="🚦"
      title="Street Safety"
      description="Vision Zero crash data across NYC — collisions, injuries, and fatalities by borough · NYPD Motor Vehicle Collisions"
      accentColor="rgba(245,158,66,.12)"
    >
      {/* KPI Cards */}
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          label="Total Crashes"
          value={totalCrashes.toLocaleString()}
          sub="Last 12 months"
          color="orange"
          tag="LIVE"
          tooltip="Total motor vehicle collisions reported to NYPD across all five boroughs in the last 12 months."
        />
        <KPICard
          label="Persons Injured"
          value={totalInjured.toLocaleString()}
          sub="All categories"
          color="blue"
          tag="LIVE"
          tooltip="Total persons injured including motorists, pedestrians, and cyclists."
        />
        <KPICard
          label="Fatalities"
          value={totalKilled.toLocaleString()}
          sub="Vision Zero goal: 0"
          color={totalKilled > 0 ? "red" : "green"}
          tag="LIVE"
          tooltip="Total persons killed in motor vehicle collisions. NYC's Vision Zero aims to eliminate all traffic deaths."
        />
        <KPICard
          label="Pedestrians Injured"
          value={totalPedInjured.toLocaleString()}
          sub="Most vulnerable road users"
          color="purple"
          tag="LIVE"
          tooltip="Pedestrians injured in motor vehicle collisions. Pedestrians account for a disproportionate share of traffic fatalities."
        />
      </div>
      </ScrollReveal>

      {hasData ? (
        <>
          {/* Charts */}
          <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <CrashesByBoroughChart data={byBorough} />
            <CrashTrendChart data={monthlyTrend} />
          </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
          <div className="mb-4">
            <ContributingFactorsChart data={topFactors} />
          </div>
          </ScrollReveal>
        </>
      ) : (
        <div className="bg-surface border border-border-light rounded-3xl p-10 text-center mb-4">
          <p className="text-dim text-sm">Crash data is temporarily unavailable.</p>
          <p className="text-muted text-xs mt-1">The NYPD Open Data API may be experiencing issues. Data will reload automatically.</p>
        </div>
      )}

      {/* Know Your Rights / Resources */}
      <ScrollReveal delay={200}>
      <div className="bg-surface border border-border-light rounded-3xl p-7 card-hover">
        <h3 className="text-[13px] font-bold mb-3">Take Action</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://portal.311.nyc.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-hp-green/5 transition-colors group card-hover"
          >
            <span className="text-lg">📞</span>
            <div>
              <p className="text-[12px] font-bold group-hover:text-hp-green transition-colors">Report a Dangerous Intersection</p>
              <p className="text-[11px] text-muted">311 or nyc.gov/311</p>
            </div>
          </a>
          <a
            href="https://www.nyc.gov/html/dot/html/pedestrians/reqaspeedbump.shtml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-hp-green/5 transition-colors group card-hover"
          >
            <span className="text-lg">🔧</span>
            <div>
              <p className="text-[12px] font-bold group-hover:text-hp-green transition-colors">Request a Speed Bump</p>
              <p className="text-[11px] text-muted">nyc.gov/dot</p>
            </div>
          </a>
          <a
            href="https://vzv.nyc/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-hp-green/5 transition-colors group card-hover"
          >
            <span className="text-lg">🗺️</span>
            <div>
              <p className="text-[12px] font-bold group-hover:text-hp-green transition-colors">Vision Zero View Map</p>
              <p className="text-[11px] text-muted">vzv.nyc</p>
            </div>
          </a>
        </div>
      </div>
      </ScrollReveal>

      {hasData && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
          <p className="text-[10px] text-hp-green font-semibold">Crash data live from NYPD Motor Vehicle Collisions · updates daily</p>
        </div>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Link href="/neighborhood" className="flex items-center gap-3 flex-1 min-w-[240px] px-4 py-3 rounded-xl bg-surface border border-border hover:border-hp-green/30 hover:shadow-sm transition-all group card-hover">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-[12px] font-semibold text-text group-hover:text-hp-green transition-colors">Safety in your neighborhood</p>
            <p className="text-[10px] text-muted">Crime, traffic, and health metrics by area</p>
          </div>
        </Link>
        <Link href="/building-health" className="flex items-center gap-3 flex-1 min-w-[240px] px-4 py-3 rounded-xl bg-surface border border-border hover:border-hp-green/30 hover:shadow-sm transition-all group card-hover">
          <span className="text-lg">🏢</span>
          <div>
            <p className="text-[12px] font-semibold text-text group-hover:text-hp-green transition-colors">Check your building</p>
            <p className="text-[10px] text-muted">Full building dossier from 5 NYC datasets</p>
          </div>
        </Link>
      </div>
    </SectionShell>
  );
}

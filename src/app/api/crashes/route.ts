import { NextResponse } from "next/server";

// NYPD Motor Vehicle Collisions — borough summary, contributing factors, monthly trend
// Revalidates daily
export const revalidate = 86400;

const BASE = "https://data.cityofnewyork.us/resource/h9gi-nx95.json";

export interface BoroughCrash {
  borough: string;
  crashes: number;
  injured: number;
  killed: number;
  pedInjured: number;
  cyclistInjured: number;
}

export interface CrashFactor {
  factor: string;
  count: number;
}

export interface MonthlyTrend {
  yr: number;
  mo: number;
  label: string;
  crashes: number;
  killed: number;
}

export async function GET() {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const boroughUrl = `${BASE}?$select=borough, count(*) as crashes, sum(number_of_persons_injured) as injured, sum(number_of_persons_killed) as killed, sum(number_of_pedestrians_injured) as ped_injured, sum(number_of_cyclist_injured) as cyclist_injured&$where=crash_date > '${fmt(twelveMonthsAgo)}' AND borough IS NOT NULL AND borough != ''&$group=borough&$order=crashes DESC`;

    const factorsUrl = `${BASE}?$select=contributing_factor_vehicle_1 as factor, count(*) as cnt&$where=crash_date > '${fmt(twelveMonthsAgo)}' AND contributing_factor_vehicle_1 != 'Unspecified'&$group=contributing_factor_vehicle_1&$order=cnt DESC&$limit=8`;

    const trendUrl = `${BASE}?$select=date_extract_y(crash_date) as yr, date_extract_m(crash_date) as mo, count(*) as crashes, sum(number_of_persons_killed) as killed&$where=crash_date > '${fmt(twoYearsAgo)}'&$group=yr,mo&$order=yr,mo`;

    const fetchOpts = { next: { revalidate }, signal: AbortSignal.timeout(10000) };
    const [boroughRes, factorsRes, trendRes] = await Promise.all([
      fetch(boroughUrl, fetchOpts),
      fetch(factorsUrl, fetchOpts),
      fetch(trendUrl, fetchOpts),
    ]);

    if (!boroughRes.ok) throw new Error(`Borough API ${boroughRes.status}`);
    if (!factorsRes.ok) throw new Error(`Factors API ${factorsRes.status}`);
    if (!trendRes.ok) throw new Error(`Trend API ${trendRes.status}`);

    const boroughRaw = await boroughRes.json() as {
      borough: string;
      crashes: string;
      injured: string;
      killed: string;
      ped_injured: string;
      cyclist_injured: string;
    }[];

    const factorsRaw = await factorsRes.json() as {
      factor: string;
      cnt: string;
    }[];

    const trendRaw = await trendRes.json() as {
      yr: string;
      mo: string;
      crashes: string;
      killed: string;
    }[];

    const MONTH_LABELS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const byBorough: BoroughCrash[] = boroughRaw.map((r) => ({
      borough: r.borough.charAt(0) + r.borough.slice(1).toLowerCase(),
      crashes: parseInt(r.crashes) || 0,
      injured: parseInt(r.injured) || 0,
      killed: parseInt(r.killed) || 0,
      pedInjured: parseInt(r.ped_injured) || 0,
      cyclistInjured: parseInt(r.cyclist_injured) || 0,
    }));

    const topFactors: CrashFactor[] = factorsRaw.map((r) => ({
      factor: r.factor,
      count: parseInt(r.cnt) || 0,
    }));

    const monthlyTrend: MonthlyTrend[] = trendRaw.map((r) => ({
      yr: parseInt(r.yr),
      mo: parseInt(r.mo),
      label: `${MONTH_LABELS[parseInt(r.mo)]} '${String(parseInt(r.yr)).slice(2)}`,
      crashes: parseInt(r.crashes) || 0,
      killed: parseInt(r.killed) || 0,
    }));

    return NextResponse.json({ byBorough, topFactors, monthlyTrend });
  } catch (err) {
    console.error("Crashes API error:", err);
    return NextResponse.json({ byBorough: [], topFactors: [], monthlyTrend: [] }, { status: 500 });
  }
}

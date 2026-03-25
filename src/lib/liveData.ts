// Server-side data fetching from live NYC/CDC APIs + Census ACS.
// All functions return null on failure — callers fall back to static data.ts values.

const FOOD_API       = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";
const RODENT_API     = "https://data.cityofnewyork.us/resource/p937-wjvj.json";
const NYC311         = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json";
const COVID_API      = "https://data.cityofnewyork.us/resource/rc75-m7u3.json";
const NYCCAS_API     = "https://data.cityofnewyork.us/resource/c3uy-2p5r.json";
const VITAL_STATS    = "https://data.cityofnewyork.us/resource/jb7j-dtam.json";
const HIV_API        = "https://data.cityofnewyork.us/resource/ykvb-493p.json";
const WASTEWATER_API = "https://data.cityofnewyork.us/resource/f7dc-2q9f.json";
const MATERNAL_MORT  = "https://data.cityofnewyork.us/resource/27x4-cbi6.json";
const CSECTION_API   = "https://data.ny.gov/resource/ms2r-yf4h.json";
const INFANT_MORT    = "https://data.cityofnewyork.us/resource/fcau-jc6k.json";
const YRBS_API       = "https://data.cityofnewyork.us/resource/3qty-g4aq.json";
const FLU_WASTEWATER = "https://data.cdc.gov/resource/ymmh-divb.json";
const DOG_BITE_API   = "https://data.cityofnewyork.us/resource/rsgh-akpg.json";
const EMS_API        = "https://data.cityofnewyork.us/resource/76xm-jjuj.json";
const BEACH_API      = "https://data.cityofnewyork.us/resource/2xir-kwzz.json";
const FARMERS_MARKET_API = "https://data.cityofnewyork.us/resource/8vwk-6iz2.json";

const AIRNOW_BASE = "https://www.airnowapi.org/aq/observation/zipCode/current/";

// Fetch with a hard timeout — prevents build hangs when external APIs are slow
async function fetchWithTimeout(url: string, init: RequestInit & { next?: { revalidate?: number } } = {}, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function boroughLabel(raw: string): string {
  if (!raw) return raw;
  if (raw === "Staten Island") return "Staten Is.";
  return raw;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Some Socrata datasets use a date (not floating_timestamp) field — must use YYYY-MM-DD only
function dateOnlyDaysAgo(n: number): string {
  return daysAgo(n).split("T")[0];
}

// floating_timestamp fields: ISO format without the Z timezone suffix
function floatingTimestampDaysAgo(n: number): string {
  return daysAgo(n).slice(0, 23); // "2025-11-01T20:53:43.206" — no Z
}

// ─── Food Safety ──────────────────────────────────────────────────────────────

export async function fetchFoodByCuisine(): Promise<{ cuisine: string; violations: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "cuisine_description,count(*) as violations",
      "$where":  "critical_flag='Critical'",
      "$group":  "cuisine_description",
      "$order":  "violations DESC",
      "$limit":  "8",
    });
    const res = await fetch(`${FOOD_API}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { cuisine_description: string; violations: string }[];
    return raw.map(d => ({ cuisine: d.cuisine_description, violations: parseInt(d.violations) }));
  } catch { return null; }
}

export async function fetchFoodByBorough(): Promise<{ borough: string; avgScore: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "boro,avg(score) as avg_score",
      "$where":  "score IS NOT NULL AND boro != '0' AND boro IS NOT NULL",
      "$group":  "boro",
    });
    const res = await fetch(`${FOOD_API}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { boro: string; avg_score: string }[];
    const VALID = new Set(["Bronx","Brooklyn","Manhattan","Queens","Staten Island"]);
    return raw
      .filter(d => VALID.has(d.boro))
      .map(d => ({ borough: boroughLabel(d.boro), avgScore: parseFloat(parseFloat(d.avg_score).toFixed(1)) }));
  } catch { return null; }
}

export async function fetchGradeDistribution(): Promise<{ name: string; value: number; fill: string }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "grade,count(*) as count",
      "$where":  "grade IN('A','B','C','N','Z')",
      "$group":  "grade",
      "$order":  "count DESC",
    });
    const res = await fetch(`${FOOD_API}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { grade: string; count: string }[];
    const COLORS: Record<string, string> = { A: "#2dd4a0", B: "#5b9cf5", C: "#f07070", N: "#f5c542", Z: "#f59e42" };
    const NAMES:  Record<string, string> = { A: "Grade A", B: "Grade B", C: "Grade C", N: "Pending N", Z: "Pending Z" };
    return raw.map(d => ({
      name:  NAMES[d.grade]  ?? d.grade,
      value: parseInt(d.count),
      fill:  COLORS[d.grade] ?? "#6b7a94",
    }));
  } catch { return null; }
}

export async function fetchCriticalViolationsCount(): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      "$select": "count(*) as count",
      "$where":  `critical_flag='Critical' AND inspection_date>'${dateOnlyDaysAgo(30)}'`,
    });
    const res = await fetch(`${FOOD_API}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { count: string }[];
    return parseInt(raw[0]?.count ?? "0") || null;
  } catch { return null; }
}

// ─── Rodent Inspections ───────────────────────────────────────────────────────

export async function fetchRodentByBorough(): Promise<
  { borough: string; total: number; active: number; passed: number }[] | null
> {
  try {
    const params = new URLSearchParams({
      "$select": "borough,result,count(*) as count",
      "$where":  `inspection_date>'${dateOnlyDaysAgo(30)}'`,
      "$group":  "borough,result",
    });
    const res = await fetch(`${RODENT_API}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { borough: string; result: string; count: string }[];
    const grouped: Record<string, { total: number; active: number; passed: number }> = {};
    for (const row of raw) {
      const b = boroughLabel(row.borough);
      if (!b || b === "Unspecified") continue;
      if (!grouped[b]) grouped[b] = { total: 0, active: 0, passed: 0 };
      const n = parseInt(row.count);
      grouped[b].total += n;
      const r = row.result?.toLowerCase() ?? "";
      // "Rat Activity" = active infestation; "Failed for Rat Act" = failed due to rat activity
      if (r.includes("rat act")) grouped[b].active += n;
      if (r.includes("passed")) grouped[b].passed += n;
    }
    return Object.entries(grouped)
      .map(([borough, v]) => ({ borough, ...v }))
      .sort((a, b) => b.total - a.total);
  } catch { return null; }
}

// ─── 311 Noise Complaints ─────────────────────────────────────────────────────

export async function fetchNoiseByBorough(): Promise<{ borough: string; complaints: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "borough,count(*) as complaints",
      "$where":  `complaint_type like 'Noise%' AND created_date>'${dateOnlyDaysAgo(7)}'`,
      "$group":  "borough",
      "$order":  "complaints DESC",
    });
    const res = await fetch(`${NYC311}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { borough: string; complaints: string }[];
    // 311 API returns borough in ALL CAPS — normalize to title case for matching
    const VALID: Record<string, string> = {
      "BRONX": "Bronx", "BROOKLYN": "Brooklyn", "MANHATTAN": "Manhattan",
      "QUEENS": "Queens", "STATEN ISLAND": "Staten Island",
      "Bronx": "Bronx", "Brooklyn": "Brooklyn", "Manhattan": "Manhattan",
      "Queens": "Queens", "Staten Island": "Staten Island",
    };
    return raw
      .filter(d => VALID[d.borough])
      .map(d => ({ borough: boroughLabel(VALID[d.borough]), complaints: parseInt(d.complaints) }));
  } catch { return null; }
}

export async function fetchNoiseByType(): Promise<{ type: string; count: number; fill: string }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "complaint_type,count(*) as count",
      "$where":  `complaint_type like 'Noise%' AND created_date>'${dateOnlyDaysAgo(7)}'`,
      "$group":  "complaint_type",
      "$order":  "count DESC",
      "$limit":  "7",
    });
    const res = await fetch(`${NYC311}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { complaint_type: string; count: string }[];
    const FILLS = ["#5b9cf5","#f59e42","#a78bfa","#2dd4a0","#f5c542","#f07070","#6b7a94"];
    return raw.map((d, i) => ({
      type:  d.complaint_type.replace(/^Noise - /, "").replace(/^Noise$/, "General"),
      count: parseInt(d.count),
      fill:  FILLS[i % FILLS.length],
    }));
  } catch { return null; }
}

// ─── COVID-19 ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function fetchCovidMonthly(): Promise<
  { month: string; cases: number; hosp: number; deaths: number }[] | null
> {
  try {
    const params = new URLSearchParams({
      "$select": "date_of_interest,case_count,hospitalized_count,death_count",
      "$where":  "incomplete='0'",
      "$order":  "date_of_interest DESC",
      "$limit":  "365",
    });
    const res = await fetch(`${COVID_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      date_of_interest: string;
      case_count: string;
      hospitalized_count: string;
      death_count: string;
    }[];

    // Aggregate by month
    const monthly = new Map<string, { cases: number; hosp: number; deaths: number; date: Date }>();
    for (const row of raw) {
      const date = new Date(row.date_of_interest);
      const key  = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
      const cur  = monthly.get(key) ?? { cases: 0, hosp: 0, deaths: 0, date };
      cur.cases  += parseInt(row.case_count        ?? "0") || 0;
      cur.hosp   += parseInt(row.hospitalized_count ?? "0") || 0;
      cur.deaths += parseInt(row.death_count        ?? "0") || 0;
      monthly.set(key, cur);
    }

    return [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, v]) => ({ month: MONTHS[v.date.getMonth()], cases: v.cases, hosp: v.hosp, deaths: v.deaths }));
  } catch { return null; }
}

export async function fetchCovidByBorough(): Promise<{ borough: string; cases: number; hosp: number }[] | null> {
  try {
    // COVID dataset has per-borough columns with bx/bk/mn/qn/si prefixes
    const params = new URLSearchParams({
      "$select": [
        "sum(bx_case_count) as bx_cases", "sum(bx_hospitalized_count) as bx_hosp",
        "sum(bk_case_count) as bk_cases", "sum(bk_hospitalized_count) as bk_hosp",
        "sum(mn_case_count) as mn_cases", "sum(mn_hospitalized_count) as mn_hosp",
        "sum(qn_case_count) as qn_cases", "sum(qn_hospitalized_count) as qn_hosp",
        "sum(si_case_count) as si_cases", "sum(si_hospitalized_count) as si_hosp",
      ].join(","),
      // 180-day window + no-Z floating_timestamp format (dataset lags ~4 months)
      "$where": `date_of_interest>'${floatingTimestampDaysAgo(180)}' AND incomplete='0'`,
    });
    const res = await fetch(`${COVID_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as Record<string, string>[];
    if (!raw[0]) return null;
    const r = raw[0];
    return [
      { borough: "Bronx",      cases: parseInt(r.bx_cases) || 0, hosp: parseInt(r.bx_hosp) || 0 },
      { borough: "Brooklyn",   cases: parseInt(r.bk_cases) || 0, hosp: parseInt(r.bk_hosp) || 0 },
      { borough: "Manhattan",  cases: parseInt(r.mn_cases) || 0, hosp: parseInt(r.mn_hosp) || 0 },
      { borough: "Queens",     cases: parseInt(r.qn_cases) || 0, hosp: parseInt(r.qn_hosp) || 0 },
      { borough: "Staten Is.", cases: parseInt(r.si_cases) || 0, hosp: parseInt(r.si_hosp) || 0 },
    ].sort((a, b) => b.cases - a.cases);
  } catch { return null; }
}

// ─── Census ACS Demographics ──────────────────────────────────────────────────

const CENSUS_BASE = "https://api.census.gov/data/2023/acs/acs5";

const COUNTY_TO_BOROUGH: Record<string, string> = {
  "005": "Bronx",
  "047": "Brooklyn",
  "061": "Manhattan",
  "081": "Queens",
  "085": "Staten Is.",
};

export type RaceRow = {
  borough: string;
  nhWhite: number;
  nhBlack: number;
  nhAsian: number;
  hispanic: number;
  other: number;
};

export async function fetchRaceByBorough(): Promise<RaceRow[] | null> {
  try {
    const vars = ["B03002_001E", "B03002_003E", "B03002_004E", "B03002_006E", "B03002_012E"].join(",");
    const url = `${CENSUS_BASE}?get=NAME,${vars}&for=county:005,047,061,081,085&in=state:36`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 86400 * 30 } }); // cache 30 days
    if (!res.ok) return null;
    const raw = (await res.json()) as string[][];
    const [header, ...rows] = raw;
    const idx = (name: string) => header.indexOf(name);
    const ORDER = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."];
    return rows
      .map(row => {
        const total    = parseInt(row[idx("B03002_001E")]);
        const nhWhite  = parseInt(row[idx("B03002_003E")]);
        const nhBlack  = parseInt(row[idx("B03002_004E")]);
        const nhAsian  = parseInt(row[idx("B03002_006E")]);
        const hispanic = parseInt(row[idx("B03002_012E")]);
        const other    = Math.max(0, total - nhWhite - nhBlack - nhAsian - hispanic);
        return { borough: COUNTY_TO_BOROUGH[row[idx("county")]], nhWhite, nhBlack, nhAsian, hispanic, other };
      })
      .filter(r => r.borough)
      .sort((a, b) => ORDER.indexOf(a.borough) - ORDER.indexOf(b.borough));
  } catch { return null; }
}

export async function fetchPovertyByBorough(): Promise<{ borough: string; pct: number }[] | null> {
  try {
    const vars = ["B17001_001E", "B17001_002E"].join(",");
    const url = `${CENSUS_BASE}?get=NAME,${vars}&for=county:005,047,061,081,085&in=state:36`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = (await res.json()) as string[][];
    const [header, ...rows] = raw;
    const idx = (name: string) => header.indexOf(name);
    const ORDER = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."];
    return rows
      .map(row => {
        const total  = parseInt(row[idx("B17001_001E")]);
        const below  = parseInt(row[idx("B17001_002E")]);
        return {
          borough: COUNTY_TO_BOROUGH[row[idx("county")]],
          pct: parseFloat(((below / total) * 100).toFixed(1)),
        };
      })
      .filter(r => r.borough)
      .sort((a, b) => ORDER.indexOf(a.borough) - ORDER.indexOf(b.borough));
  } catch { return null; }
}

export async function fetchMedianIncomeByBorough(): Promise<{ borough: string; income: number }[] | null> {
  try {
    const url = `${CENSUS_BASE}?get=NAME,B19013_001E&for=county:005,047,061,081,085&in=state:36`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = (await res.json()) as string[][];
    const [header, ...rows] = raw;
    const idx = (name: string) => header.indexOf(name);
    const ORDER = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."];
    return rows
      .map(row => ({
        borough: COUNTY_TO_BOROUGH[row[idx("county")]],
        income: parseInt(row[idx("B19013_001E")]),
      }))
      .filter(r => r.borough && r.income > 0)
      .sort((a, b) => ORDER.indexOf(a.borough) - ORDER.indexOf(b.borough));
  } catch { return null; }
}

// ─── NYCCAS Air Quality ───────────────────────────────────────────────────────

type NyccastRow = {
  geo_type_name: string;
  geo_place_name: string;
  name: string;
  data_value: string;
  time_period: string;
};

export async function fetchAirQualityNeighborhoods(): Promise<{ name: string; value: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$where": "geo_type_name='UHF42' AND name like 'Fine%'",
      "$select": "geo_place_name,data_value,time_period",
      "$order": "time_period DESC",
      "$limit": "500",
    });
    const res = await fetch(`${NYCCAS_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as NyccastRow[];

    // Prefer annual data; fall back to whatever is latest
    const annual = raw.filter(r => r.time_period?.toLowerCase().includes("annual"));
    const source = annual.length > 0 ? annual : raw;
    if (source.length === 0) return null;

    const latestPeriod = source[0].time_period;
    return source
      .filter(r => r.time_period === latestPeriod && r.data_value)
      .map(r => ({ name: r.geo_place_name, value: Math.round(parseFloat(r.data_value) * 10) / 10 }))
      .filter(r => !isNaN(r.value))
      .sort((a, b) => a.value - b.value);
  } catch { return null; }
}

export async function fetchAirQualityByBorough(): Promise<
  { borough: string; pm25: number; no2: number; o3: number }[] | null
> {
  try {
    const params = new URLSearchParams({
      "$where": "geo_type_name='Borough' AND (name like 'Fine%' OR name like 'Nitrogen%' OR name like 'Ozone%')",
      "$select": "geo_place_name,name,data_value,time_period",
      "$order": "time_period DESC",
      "$limit": "300",
    });
    const res = await fetch(`${NYCCAS_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as NyccastRow[];

    const annual = raw.filter(r => r.time_period?.toLowerCase().includes("annual"));
    const source = annual.length > 0 ? annual : raw;
    if (source.length === 0) return null;

    const latestPeriod = source[0].time_period;
    const rows = source.filter(r => r.time_period === latestPeriod);

    const BOROS = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];
    const lookup: Record<string, { pm25: number; no2: number; o3: number }> = {};
    for (const row of rows) {
      const match = BOROS.find(b => row.geo_place_name?.includes(b));
      if (!match) continue;
      const label = match === "Staten Island" ? "Staten Is." : match;
      if (!lookup[label]) lookup[label] = { pm25: 0, no2: 0, o3: 0 };
      const v = Math.round(parseFloat(row.data_value) * 10) / 10;
      if (isNaN(v)) continue;
      const n = row.name?.toLowerCase() ?? "";
      if (n.includes("fine"))     lookup[label].pm25 = v;
      else if (n.includes("nitrogen")) lookup[label].no2  = v;
      else if (n.includes("ozone"))    lookup[label].o3   = v;
    }
    return Object.entries(lookup).map(([borough, vals]) => ({ borough, ...vals }));
  } catch { return null; }
}

export async function fetchNeighborhoodPm25(geocode: number): Promise<{ pm25: number; period: string } | null> {
  try {
    const params = new URLSearchParams({
      "$where": `geo_type_name='UHF42' AND name like 'Fine%' AND geo_join_id='${geocode}'`,
      "$select": "data_value,time_period",
      "$order": "time_period DESC",
      "$limit": "10",
    });
    const res = await fetch(`${NYCCAS_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { data_value: string; time_period: string }[];
    const annual = raw.find(r => r.time_period?.toLowerCase().includes("annual"));
    const row = annual ?? raw[0];
    if (!row?.data_value) return null;
    return { pm25: Math.round(parseFloat(row.data_value) * 10) / 10, period: row.time_period };
  } catch { return null; }
}

export async function fetchCitywideAirQuality(): Promise<{ pm25: number; period: string } | null> {
  try {
    const params = new URLSearchParams({
      "$where": "geo_type_name='Citywide' AND name like 'Fine%'",
      "$select": "data_value,time_period",
      "$order": "time_period DESC",
      "$limit": "10",
    });
    const res = await fetch(`${NYCCAS_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { data_value: string; time_period: string }[];
    const annual = raw.find(r => r.time_period?.toLowerCase().includes("annual"));
    const row = annual ?? raw[0];
    if (!row?.data_value) return null;
    return { pm25: Math.round(parseFloat(row.data_value) * 10) / 10, period: row.time_period };
  } catch { return null; }
}

// ─── AirNow — Real-time AQI ──────────────────────────────────────────────────

export type AirNowAQI = { aqi: number; category: string; parameter: string; reportingArea: string };

export async function fetchAirNowAQI(): Promise<AirNowAQI | null> {
  const key = process.env.AIRNOW_API_KEY;
  if (!key) return null;
  try {
    const url = `${AIRNOW_BASE}?format=application/json&zipCode=10001&distance=15&API_KEY=${key}`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json() as { AQI: number; Category: { Name: string }; ParameterName: string; ReportingArea: string }[];
    // Find PM2.5 observation (preferred) or take first
    const pm25 = data.find(d => d.ParameterName === "PM2.5") ?? data[0];
    if (!pm25) return null;
    return {
      aqi: pm25.AQI,
      category: pm25.Category?.Name ?? "Unknown",
      parameter: pm25.ParameterName,
      reportingArea: pm25.ReportingArea,
    };
  } catch { return null; }
}

// ─── Vital Statistics — Leading Causes of Death ───────────────────────────────

export type CauseOfDeath = { cause: string; deaths: number; rate: number };

export async function fetchLeadingCauses(): Promise<CauseOfDeath[] | null> {
  try {
    const params = new URLSearchParams({
      "$where": "sex='Total'",
      "$select": "leading_cause,deaths,age_adjusted_death_rate,year",
      "$order": "year DESC",
      "$limit": "500",
    });
    const res = await fetch(`${VITAL_STATS}?${params}`, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return null;
    const raw = await res.json() as { leading_cause: string; deaths: string; age_adjusted_death_rate: string; year: string }[];
    if (raw.length === 0) return null;

    // Use the most recent year available
    const latestYear = raw[0].year;
    const yearRows = raw.filter(r => r.year === latestYear && r.deaths && r.deaths !== ".");

    // Group by cause, pick max deaths row (the "all races" aggregate)
    const grouped = new Map<string, { deaths: number; rate: number }>();
    for (const row of yearRows) {
      const deaths = parseInt(row.deaths);
      if (isNaN(deaths)) continue;
      const rate = parseFloat(row.age_adjusted_death_rate ?? "0") || 0;
      const existing = grouped.get(row.leading_cause);
      if (!existing || deaths > existing.deaths) {
        grouped.set(row.leading_cause, { deaths, rate });
      }
    }

    // Clean up cause names (remove ICD codes, shorten)
    const clean = (cause: string) => cause
      .replace(/\s*\(.*?\)\s*/g, "")
      .replace(/Diseases?/gi, "Disease")
      .trim()
      .slice(0, 40);

    return [...grouped.entries()]
      .map(([cause, v]) => ({ cause: clean(cause), ...v }))
      .sort((a, b) => b.deaths - a.deaths)
      .slice(0, 8);
  } catch { return null; }
}

// ─── Census ACS — Uninsured Rate ─────────────────────────────────────────────

export async function fetchUninsuredByBorough(): Promise<{ borough: string; pct: number; count: number }[] | null> {
  try {
    // S2701_C04_001E = uninsured estimate; S2701_C01_001E = total civilian pop
    const url = `${CENSUS_BASE}/subject?get=NAME,S2701_C04_001E,S2701_C01_001E&for=county:005,047,061,081,085&in=state:36`;
    const res = await fetchWithTimeout(url, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = (await res.json()) as string[][];
    const [header, ...rows] = raw;
    const idx = (name: string) => header.indexOf(name);
    const ORDER = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."];
    return rows
      .map(row => {
        const total    = parseInt(row[idx("S2701_C01_001E")]);
        const uninsured = parseInt(row[idx("S2701_C04_001E")]);
        return {
          borough: COUNTY_TO_BOROUGH[row[idx("county")]],
          count: uninsured,
          pct: parseFloat(((uninsured / total) * 100).toFixed(1)),
        };
      })
      .filter(r => r.borough && r.pct > 0)
      .sort((a, b) => ORDER.indexOf(a.borough) - ORDER.indexOf(b.borough));
  } catch { return null; }
}

// ─── DEP Drinking Water Quality ───────────────────────────────────────────────

const DEP_WATER = "https://data.cityofnewyork.us/resource/bkwf-xfky.json";

export type WaterQualitySummary = {
  avgChlorine: number;
  avgTurbidity: number;
  avgFluoride: number;
  coliformDetected: number;
  totalSamples: number;
  latestDate: string;
};

export async function fetchWaterQuality(): Promise<WaterQualitySummary | null> {
  try {
    const params = new URLSearchParams({
      "$select": "sample_date,residual_free_chlorine_mg_l,turbidity_ntu,fluoride_mg_l,coliform_quanti_tray_mpn_100ml",
      // No date filter — dataset lags ~2 months; fetch most recent 1000 operational samples
      "$where":  "sample_class='Operational'",
      "$order":  "sample_date DESC",
      "$limit":  "1000",
    });
    const res = await fetch(`${DEP_WATER}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      sample_date: string;
      residual_free_chlorine_mg_l?: string;
      turbidity_ntu?: string;
      fluoride_mg_l?: string;
      coliform_quanti_tray_mpn_100ml?: string;
    }[];
    if (raw.length === 0) return null;

    let chlorineSum = 0, chlorineN = 0;
    let turbiditySum = 0, turbidityN = 0;
    let fluorideSum = 0, fluorideN = 0;
    let coliformDetected = 0;

    for (const row of raw) {
      const cl = parseFloat(row.residual_free_chlorine_mg_l ?? "");
      if (!isNaN(cl) && cl >= 0) { chlorineSum += cl; chlorineN++; }
      const tu = parseFloat(row.turbidity_ntu ?? "");
      if (!isNaN(tu)) { turbiditySum += tu; turbidityN++; }
      const fl = parseFloat(row.fluoride_mg_l ?? "");
      if (!isNaN(fl) && fl > 0) { fluorideSum += fl; fluorideN++; }
      const co = row.coliform_quanti_tray_mpn_100ml ?? "<1";
      if (co !== "<1" && parseFloat(co) >= 1) coliformDetected++;
    }

    return {
      avgChlorine:  chlorineN  > 0 ? parseFloat((chlorineSum  / chlorineN ).toFixed(3)) : 0,
      avgTurbidity: turbidityN > 0 ? parseFloat((turbiditySum / turbidityN).toFixed(2)) : 0,
      avgFluoride:  fluorideN  > 0 ? parseFloat((fluorideSum  / fluorideN ).toFixed(2)) : 0,
      coliformDetected,
      totalSamples: raw.length,
      latestDate: raw[0].sample_date?.split("T")[0] ?? "",
    };
  } catch { return null; }
}

// ─── CDC PLACES — County-level chronic disease estimates ──────────────────────

const CDC_PLACES_COUNTY = "https://data.cdc.gov/resource/swc5-untb.json";

// NYC county FIPS codes (36 = New York State)
const NYC_FIPS = new Set(["36005","36047","36061","36081","36085"]);
const FIPS_TO_BOROUGH: Record<string, string> = {
  "36005": "Bronx",
  "36047": "Brooklyn",
  "36061": "Manhattan",
  "36081": "Queens",
  "36085": "Staten Is.",
};

export type CdcPlacesBorough = {
  borough: string;
  obesity:     number | null;
  diabetes:    number | null;
  depression:  number | null;
  asthma:      number | null;
  smoking:     number | null;
  inactivity:  number | null;
  highBP:      number | null;
  uninsured:   number | null;
};

export async function fetchCdcPlacesByBorough(): Promise<CdcPlacesBorough[] | null> {
  try {
    // Fetch all age-adjusted prevalence measures for NY state, then filter to NYC counties
    const params = new URLSearchParams({
      stateabbr:        "NY",
      datavaluetypeid:  "AgeAdjPrv",
      "$limit":         "5000",
    });
    const res = await fetch(`${CDC_PLACES_COUNTY}?${params}`, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      locationid: string;
      locationname: string;
      measureid: string;
      data_value: string;
    }[];

    // Build a map: FIPS → measure → value
    const map = new Map<string, Record<string, number>>();
    for (const row of raw) {
      if (!NYC_FIPS.has(row.locationid)) continue;
      if (!map.has(row.locationid)) map.set(row.locationid, {});
      const val = parseFloat(row.data_value);
      if (!isNaN(val)) map.get(row.locationid)![row.measureid] = val;
    }

    if (map.size === 0) return null;

    const ORDER = ["Bronx","Brooklyn","Manhattan","Queens","Staten Is."];
    return [...map.entries()]
      .map(([fips, measures]) => ({
        borough:    FIPS_TO_BOROUGH[fips],
        obesity:    measures["OBESITY"]    ?? null,
        diabetes:   measures["DIABETES"]   ?? null,
        depression: measures["DEPRESSION"] ?? null,
        asthma:     measures["CASTHMA"]    ?? null,
        smoking:    measures["CSMOKING"]   ?? null,
        inactivity: measures["LPA"]        ?? null,
        highBP:     measures["BPHIGH"]     ?? null,
        uninsured:  measures["ACCESS2"]    ?? null,
      }))
      .filter(r => r.borough)
      .sort((a, b) => ORDER.indexOf(a.borough) - ORDER.indexOf(b.borough));
  } catch { return null; }
}

// ─── HIV/AIDS Surveillance ────────────────────────────────────────────────────

// UHF42 neighborhood name → geocode (matches HIV dataset's neighborhood field)
const HIV_UHF_GEOCODE: Record<string, number> = {
  "Kingsbridge - Riverdale":              101,
  "Northeast Bronx":                      102,
  "Fordham - Bronx Park":                103,
  "Pelham - Throgs Neck":                104,
  "Crotona - Tremont":                   105,
  "High Bridge - Morrisania":            106,
  "Hunts Point - Mott Haven":            107,
  "Greenpoint":                           201,
  "Downtown - Heights - Slope":          202,
  "Bedford Stuyvesant - Crown Heights":  203,
  "East New York":                        204,
  "Sunset Park":                          205,
  "Borough Park":                         206,
  "East Flatbush - Flatbush":            207,
  "Canarsie - Flatlands":                208,
  "Bensonhurst - Bay Ridge":             209,
  "Coney Island - Sheepshead Bay":       210,
  "Williamsburg - Bushwick":             211,
  "Washington Heights - Inwood":         301,
  "Central Harlem - Morningside Heights": 302,
  "East Harlem":                          303,
  "Upper West Side":                      304,
  "Upper East Side":                      305,
  "Chelsea - Village":                    306,
  "Gramercy Park - Murray Hill":         307,
  "Greenwich Village - SoHo":           308,
  "Union Square - Lower East Side":      309,
  "Lower Manhattan":                      310,
  "Long Island City - Astoria":          401,
  "West Queens":                          402,
  "Flushing - Clearview":                403,
  "Bayside - Little Neck":               404,
  "Ridgewood - Forest Hills":            405,
  "Fresh Meadows":                        406,
  "Southwest Queens":                     407,
  "Jamaica":                              408,
  "Southeast Queens":                     409,
  "Rockaway":                             410,
  "Port Richmond":                        501,
  "Stapleton - St. George":              502,
  "Willowbrook":                          503,
  "South Beach - Tottenville":           504,
};

export type HivBoroughRow = { borough: string; rate: number; diagnoses: number };

export async function fetchHivByBorough(): Promise<HivBoroughRow[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "borough,neighborhood,hiv_diagnoses_num,hiv_diagnoses_num_per_100k,year",
      "$order": "year DESC",
      "$limit": "500",
    });
    const res = await fetch(`${HIV_API}?${params}`, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      borough: string;
      neighborhood: string;
      hiv_diagnoses_num: string;
      hiv_diagnoses_num_per_100k: string;
      year: string;
    }[];
    if (raw.length === 0) return null;

    const latestYear = raw[0].year;
    const BOROS = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];
    const LABELS: Record<string, string> = { "Staten Island": "Staten Is." };

    // Borough-level rows: neighborhood field equals borough or is "All"
    const boroughRows = raw.filter(r =>
      r.year === latestYear &&
      BOROS.includes(r.borough) &&
      (r.neighborhood === "All" || r.neighborhood === r.borough || !r.neighborhood)
    );

    // If "All" rows not found, just sum neighborhoods per borough
    if (boroughRows.length === 0) {
      const summed = new Map<string, { diagnoses: number; year: string }>();
      for (const row of raw.filter(r => r.year === latestYear && BOROS.includes(r.borough))) {
        const n = parseInt(row.hiv_diagnoses_num ?? "0") || 0;
        const cur = summed.get(row.borough) ?? { diagnoses: 0, year: row.year };
        summed.set(row.borough, { diagnoses: cur.diagnoses + n, year: cur.year });
      }
      return [...summed.entries()].map(([b, v]) => ({
        borough: LABELS[b] ?? b,
        diagnoses: v.diagnoses,
        rate: 0,
      })).sort((a, b) => b.diagnoses - a.diagnoses);
    }

    return boroughRows
      .map(r => ({
        borough: LABELS[r.borough] ?? r.borough,
        rate:      parseFloat(r.hiv_diagnoses_num_per_100k ?? "0") || 0,
        diagnoses: parseInt(r.hiv_diagnoses_num ?? "0") || 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  } catch { return null; }
}

export async function fetchHivByNeighborhood(): Promise<{ geocode: number; rate: number; diagnoses: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "neighborhood,hiv_diagnoses_num,hiv_diagnoses_num_per_100k,year",
      "$order": "year DESC",
      "$limit": "600",
    });
    const res = await fetch(`${HIV_API}?${params}`, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      neighborhood: string;
      hiv_diagnoses_num: string;
      hiv_diagnoses_num_per_100k: string;
      year: string;
    }[];
    if (raw.length === 0) return null;
    const latestYear = raw[0].year;
    const results: { geocode: number; rate: number; diagnoses: number }[] = [];
    for (const row of raw.filter(r => r.year === latestYear)) {
      const geocode = HIV_UHF_GEOCODE[row.neighborhood];
      if (!geocode) continue;
      results.push({
        geocode,
        rate:      parseFloat(row.hiv_diagnoses_num_per_100k ?? "0") || 0,
        diagnoses: parseInt(row.hiv_diagnoses_num ?? "0") || 0,
      });
    }
    return results.length > 0 ? results : null;
  } catch { return null; }
}

// ─── Childhood Blood Lead Levels (DOHMH) ─────────────────────────────────────

const LEAD_API = "https://data.cityofnewyork.us/resource/tnry-kwh5.json";

export async function fetchLeadByNeighborhood(): Promise<{ geocode: number; pct: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$where": "geo_type_desc='UHF42'",
      "$select": "geo_join_id,bll_5_total_pct,time_period",
      "$order": "time_period DESC",
      "$limit": "200",
    });
    const res = await fetch(`${LEAD_API}?${params}`, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = await res.json() as { geo_join_id: string; bll_5_total_pct: string; time_period: string }[];
    if (raw.length === 0) return null;
    const latestPeriod = raw[0].time_period;
    return raw
      .filter(r => r.time_period === latestPeriod && r.bll_5_total_pct)
      .map(r => ({ geocode: parseInt(r.geo_join_id), pct: parseFloat(r.bll_5_total_pct) }))
      .filter(r => !isNaN(r.geocode) && !isNaN(r.pct) && r.geocode > 0);
  } catch { return null; }
}

// ─── Heat Vulnerability Index (NYC DOHMH) ─────────────────────────────────────

const HEAT_VULN_API = "https://data.cityofnewyork.us/resource/4mhf-duep.json";

export async function fetchHeatVulnerabilityByNeighborhood(): Promise<{ geocode: number; score: number }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "geocode,hvi_score",
      "$limit": "100",
    });
    const res = await fetch(`${HEAT_VULN_API}?${params}`, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = await res.json() as { geocode: string; hvi_score: string }[];
    if (raw.length === 0) return null;
    return raw
      .map(r => ({ geocode: parseInt(r.geocode), score: parseFloat(r.hvi_score ?? "0") || 0 }))
      .filter(r => !isNaN(r.geocode) && r.geocode > 0);
  } catch { return null; }
}

// ─── COVID Wastewater Surveillance ───────────────────────────────────────────

export type WastewaterRow = { date: string; facility: string; copiesPerL: number };

export async function fetchWastewaterTrend(): Promise<WastewaterRow[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "sample_date,wrrf_abbreviation,copies_l",
      "$where": `sample_date > '${daysAgo(180)}'`,
      "$order": "sample_date ASC",
      "$limit": "2000",
    });
    const res = await fetchWithTimeout(`${WASTEWATER_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { sample_date: string; wrrf_abbreviation: string; copies_l: string }[];
    if (raw.length === 0) return null;
    return raw.map(r => ({
      date: r.sample_date.slice(0, 10),
      facility: r.wrrf_abbreviation ?? "Unknown",
      copiesPerL: parseFloat(r.copies_l ?? "0") || 0,
    }));
  } catch { return null; }
}

export type WastewaterCitywide = { date: string; avgCopiesPerL: number };

export async function fetchWastewaterCitywide(): Promise<WastewaterCitywide[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "date_trunc_ymd(sample_date) as day, avg(copies_l) as avg_copies",
      "$where": `sample_date > '${daysAgo(180)}'`,
      "$group": "day",
      "$order": "day ASC",
      "$limit": "200",
    });
    const res = await fetchWithTimeout(`${WASTEWATER_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { day: string; avg_copies: string }[];
    if (raw.length === 0) return null;
    return raw.map(r => ({
      date: r.day.slice(0, 10),
      avgCopiesPerL: parseFloat(r.avg_copies ?? "0") || 0,
    }));
  } catch { return null; }
}

// ─── Maternal Mortality ──────────────────────────────────────────────────────

export type MaternalMortalityRow = { cause: string; deaths: number; raceEthnicity: string; borough: string };

export async function fetchMaternalMortality(): Promise<MaternalMortalityRow[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "underlying_cause,deaths,race_ethnicity,borough",
      "$where": "upper(related)='PREGNANCY-RELATED' AND underlying_cause != 'All' AND race_ethnicity != 'All' AND borough != 'All'",
      "$limit": "500",
    });
    const res = await fetchWithTimeout(`${MATERNAL_MORT}?${params}`, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = await res.json() as { underlying_cause: string; deaths: string; race_ethnicity: string; borough: string }[];
    if (raw.length === 0) return null;
    return raw.map(r => ({
      cause: r.underlying_cause ?? "Unknown",
      deaths: parseInt(r.deaths ?? "0") || 0,
      raceEthnicity: r.race_ethnicity ?? "Unknown",
      borough: boroughLabel(r.borough ?? ""),
    }));
  } catch { return null; }
}

// ─── C-Section Rates (NY State, filtered to NYC counties) ────────────────────

const NYC_COUNTIES = ["New York", "Kings", "Queens", "Bronx", "Richmond"];
const COUNTY_NAME_TO_BOROUGH: Record<string, string> = {
  "New York": "Manhattan",
  "Kings": "Brooklyn",
  "Queens": "Queens",
  "Bronx": "Bronx",
  "Richmond": "Staten Is.",
};

export type CSectionRow = { borough: string; vaginal: number; cesarean: number; csectionPct: number };

export async function fetchCSectionRates(): Promise<CSectionRow[] | null> {
  try {
    const countyFilter = NYC_COUNTIES.map(c => `county_of_residence='${c}'`).join(" OR ");
    const params = new URLSearchParams({
      "$select": "county_of_residence,method_of_delivery,sum(live_births) as total",
      "$where": countyFilter,
      "$group": "county_of_residence,method_of_delivery",
      "$limit": "100",
    });
    const res = await fetchWithTimeout(`${CSECTION_API}?${params}`, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = await res.json() as { county_of_residence: string; method_of_delivery: string; total: string }[];
    if (raw.length === 0) return null;

    const byCounty = new Map<string, { vaginal: number; cesarean: number }>();
    for (const r of raw) {
      const county = r.county_of_residence;
      const cur = byCounty.get(county) ?? { vaginal: 0, cesarean: 0 };
      const count = parseInt(r.total ?? "0") || 0;
      if (/cesarean/i.test(r.method_of_delivery)) cur.cesarean += count;
      else cur.vaginal += count;
      byCounty.set(county, cur);
    }

    return [...byCounty.entries()]
      .filter(([county]) => NYC_COUNTIES.includes(county))
      .map(([county, { vaginal, cesarean }]) => ({
        borough: COUNTY_NAME_TO_BOROUGH[county] ?? county,
        vaginal,
        cesarean,
        csectionPct: vaginal + cesarean > 0 ? Math.round((cesarean / (vaginal + cesarean)) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.csectionPct - a.csectionPct);
  } catch { return null; }
}

// ─── Infant Mortality by Race/Ethnicity ──────────────────────────────────────

export type InfantMortalityRow = {
  race: string;
  infantRate: number;
  neonatalRate: number;
  deaths: number;
  liveBirths: number;
  year: string;
};

export async function fetchInfantMortality(): Promise<InfantMortalityRow[] | null> {
  try {
    const params = new URLSearchParams({
      "$order": "year DESC",
      "$limit": "100",
    });
    const res = await fetchWithTimeout(`${INFANT_MORT}?${params}`, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      year: string;
      materal_race_or_ethnicity: string;
      infant_mortality_rate: string;
      neonatal_mortality_rate: string;
      infant_deaths: string;
      number_of_live_births: string;
    }[];
    if (raw.length === 0) return null;
    const latestYear = raw[0].year;
    return raw
      .filter(r => r.year === latestYear && r.materal_race_or_ethnicity !== "Total" && r.materal_race_or_ethnicity !== "Other and Unknown")
      .map(r => ({
        race: r.materal_race_or_ethnicity,
        infantRate: parseFloat(r.infant_mortality_rate ?? "0") || 0,
        neonatalRate: parseFloat(r.neonatal_mortality_rate ?? "0") || 0,
        deaths: parseInt(r.infant_deaths ?? "0") || 0,
        liveBirths: parseInt(r.number_of_live_births ?? "0") || 0,
        year: r.year,
      }))
      .sort((a, b) => b.infantRate - a.infantRate);
  } catch { return null; }
}

// ─── NYC Youth Risk Behavior Survey ──────────────────────────────────────────

export type YrbsRow = {
  year: string;
  obesity: number;
  smoking: number;
  bingeDrinking: number;
  sodaDaily: number;
  physicallyActive: number;
};

export async function fetchYouthRiskBehavior(): Promise<YrbsRow[] | null> {
  try {
    const params = new URLSearchParams({
      "$where": "prevalence LIKE 'Prevalence%'",
      "$order": "year ASC",
      "$limit": "20",
    });
    const res = await fetchWithTimeout(`${YRBS_API}?${params}`, { next: { revalidate: 86400 * 30 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      year: string;
      adolescent_obesity: string;
      smoked_30days: string;
      bingedrink_30days: string;
      drinks_1_or_more_sodas_per_day_in_past_7_days: string;
      physically_active_60_minutes_per_day: string;
    }[];
    if (raw.length === 0) return null;
    return raw.map(r => ({
      year: r.year,
      obesity: parseFloat(r.adolescent_obesity ?? "0") || 0,
      smoking: parseFloat(r.smoked_30days ?? "0") || 0,
      bingeDrinking: parseFloat(r.bingedrink_30days ?? "0") || 0,
      sodaDaily: parseFloat(r.drinks_1_or_more_sodas_per_day_in_past_7_days ?? "0") || 0,
      physicallyActive: parseFloat(r.physically_active_60_minutes_per_day ?? "0") || 0,
    })).filter(r => r.obesity > 0);
  } catch { return null; }
}

// ─── CDC Influenza Wastewater (NYC sites) ────────────────────────────────────

export type FluWastewaterRow = { date: string; detected: boolean; concentration: number };

export async function fetchFluWastewater(): Promise<FluWastewaterRow[] | null> {
  try {
    const nycFips = ["36005", "36047", "36061", "36081", "36085"];
    const fipsFilter = nycFips.map(f => `county_fips='${f}'`).join(" OR ");
    const params = new URLSearchParams({
      "$select": "sample_collect_date,pcr_target_avg_conc,pcr_target_detect",
      "$where": `state_territory='ny' AND pcr_target='fluav' AND pcr_target_units='copies/l wastewater' AND (${fipsFilter}) AND sample_collect_date > '${daysAgo(180)}'`,
      "$order": "sample_collect_date ASC",
      "$limit": "1000",
    });
    const res = await fetchWithTimeout(`${FLU_WASTEWATER}?${params}`, { next: { revalidate: 86400 * 7 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      sample_collect_date: string;
      pcr_target_avg_conc: string;
      pcr_target_detect: string;
    }[];
    if (raw.length === 0) return null;

    // Aggregate by date (average across NYC sites)
    const byDate = new Map<string, { sum: number; count: number; detected: number }>();
    for (const r of raw) {
      const date = r.sample_collect_date.slice(0, 10);
      const cur = byDate.get(date) ?? { sum: 0, count: 0, detected: 0 };
      cur.sum += parseFloat(r.pcr_target_avg_conc ?? "0") || 0;
      cur.count += 1;
      if (r.pcr_target_detect === "yes") cur.detected += 1;
      byDate.set(date, cur);
    }

    return [...byDate.entries()]
      .map(([date, { sum, count, detected }]) => ({
        date,
        detected: detected > 0,
        concentration: Math.round(sum / count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch { return null; }
}

// ─── Dog Bite Data ───────────────────────────────────────────────────────────

export type DogBiteByBorough = { borough: string; count: number; topBreed: string };

export async function fetchDogBitesByBorough(): Promise<DogBiteByBorough[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "borough,breed,count(*) as cnt",
      "$where": `dateofbite > '${daysAgo(365)}'`,
      "$group": "borough,breed",
      "$order": "cnt DESC",
      "$limit": "200",
    });
    const res = await fetchWithTimeout(`${DOG_BITE_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { borough: string; breed: string; cnt: string }[];
    if (raw.length === 0) return null;

    const byBorough = new Map<string, { total: number; breeds: Map<string, number> }>();
    for (const r of raw) {
      const b = boroughLabel(r.borough);
      if (!b || b === "Other") continue;
      const cur = byBorough.get(b) ?? { total: 0, breeds: new Map() };
      const cnt = parseInt(r.cnt) || 0;
      cur.total += cnt;
      cur.breeds.set(r.breed, (cur.breeds.get(r.breed) ?? 0) + cnt);
      byBorough.set(b, cur);
    }

    return [...byBorough.entries()]
      .map(([borough, { total, breeds }]) => {
        const topBreed = [...breeds.entries()]
          .filter(([name]) => name !== "UNKNOWN" && name !== "MIXED BREED")
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";
        return { borough, count: total, topBreed: topBreed.charAt(0) + topBreed.slice(1).toLowerCase() };
      })
      .sort((a, b) => b.count - a.count);
  } catch { return null; }
}

// ─── EMS Response Time by Borough ────────────────────────────────────────────

export type EmsResponseBorough = { borough: string; avgResponseSec: number; incidents: number };

export async function fetchEmsResponseByBorough(): Promise<EmsResponseBorough[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "borough,avg(incident_response_seconds_qy) as avg_resp,count(*) as cnt",
      "$where": `valid_incident_rspns_time_indc='Y' AND incident_datetime > '${daysAgo(365)}'`,
      "$group": "borough",
      "$order": "avg_resp DESC",
      "$limit": "10",
    });
    const res = await fetchWithTimeout(`${EMS_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { borough: string; avg_resp: string; cnt: string }[];
    if (raw.length === 0) return null;

    return raw
      .filter(r => r.borough && r.borough !== "null")
      .map(r => ({
        borough: boroughLabel(r.borough),
        avgResponseSec: Math.round(parseFloat(r.avg_resp) || 0),
        incidents: parseInt(r.cnt) || 0,
      }))
      .filter(r => r.borough && r.avgResponseSec > 0)
      .sort((a, b) => b.avgResponseSec - a.avgResponseSec);
  } catch { return null; }
}

// ─── Beach Water Quality ─────────────────────────────────────────────────────

const BEACH_BOROUGH: Record<string, string> = {
  "ORCHARD BEACH": "Bronx",
  "SCHUYLER HILL CIVIC ASSOCIATION": "Bronx",
  "LOCUST POINT YACHT CLUB": "Bronx",
  "CONEY ISLAND WEST 8TH - PIER": "Brooklyn",
  "CONEY ISLAND BR. 6TH - OCEAN PKWY": "Brooklyn",
  "CONEY ISLAND WEST 16TH - WEST 27TH": "Brooklyn",
  "MANHATTAN BEACH": "Brooklyn",
  "KINGSBOROUGH COMMUNITY COLLEGE": "Brooklyn",
  "GERRITSEN/KIDDIE BEACH": "Brooklyn",
  "SOUTH BEACH": "Staten Island",
  "MIDLAND BEACH": "Staten Island",
  "CEDAR GROVE": "Staten Island",
  "WOLFE'S POND PARK": "Staten Island",
  "DOUGLASTON HOMEOWNERS ASSOCIATION": "Queens",
  "BREEZY POINT - 219TH STREET": "Queens",
};

export type BeachWaterRow = {
  beach: string;
  borough: string;
  avgEnterococci: number;
  samples: number;
  safe: boolean; // EPA standard: ≤104 MPN/100ml
};

export async function fetchBeachWater(): Promise<BeachWaterRow[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "beach_name,count(*) as samples,avg(enterococci_results) as avg_ec",
      "$where": `sample_date > '${daysAgo(365)}'`,
      "$group": "beach_name",
      "$order": "avg_ec DESC",
      "$limit": "30",
    });
    const res = await fetchWithTimeout(`${BEACH_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as { beach_name: string; samples: string; avg_ec: string }[];
    if (raw.length === 0) return null;

    return raw
      .filter(r => r.beach_name && r.avg_ec)
      .map(r => {
        const avg = parseFloat(r.avg_ec) || 0;
        return {
          beach: r.beach_name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" "),
          borough: BEACH_BOROUGH[r.beach_name] ?? "",
          avgEnterococci: Math.round(avg * 10) / 10,
          samples: parseInt(r.samples) || 0,
          safe: avg <= 104,
        };
      })
      .slice(0, 15);
  } catch { return null; }
}

// ─── Pollen & Allergy Forecast ──────────────────────────────────────────────

export type PollenForecast = {
  level: string;
  tree: string;
  grass: string;
  weed: string;
  topAllergens?: string;
  note: string;
  source: "tomorrow.io" | "seasonal-estimate";
};

const SEASONAL_POLLEN: Record<string, Omit<PollenForecast, "source">> = {
  "12": { level: "None", tree: "None", grass: "None", weed: "None", note: "Pollen season is over. Indoor allergens (dust mites, mold) are the main concern." },
  "1":  { level: "None", tree: "None", grass: "None", weed: "None", note: "Pollen season is over. Indoor allergens (dust mites, mold) are the main concern." },
  "2":  { level: "None", tree: "None", grass: "None", weed: "None", note: "Pollen season is over. Indoor allergens (dust mites, mold) are the main concern." },
  "3":  { level: "High", tree: "High", grass: "Low", weed: "None", topAllergens: "Oak, Birch, Maple", note: "Tree pollen is dominant. Consider limiting outdoor exercise before 10 AM." },
  "4":  { level: "High", tree: "High", grass: "Low", weed: "None", topAllergens: "Oak, Birch, Maple", note: "Tree pollen is dominant. Consider limiting outdoor exercise before 10 AM." },
  "5":  { level: "High", tree: "Moderate", grass: "High", weed: "Low", topAllergens: "Timothy, Bermuda Grass", note: "Grass pollen peaks in late spring." },
  "6":  { level: "High", tree: "Moderate", grass: "High", weed: "Low", topAllergens: "Timothy, Bermuda Grass", note: "Grass pollen peaks in late spring." },
  "7":  { level: "Moderate", tree: "Low", grass: "Moderate", weed: "High", topAllergens: "Ragweed", note: "Ragweed season begins in August." },
  "8":  { level: "Moderate", tree: "Low", grass: "Moderate", weed: "High", topAllergens: "Ragweed", note: "Ragweed season begins in August." },
  "9":  { level: "Moderate", tree: "None", grass: "Low", weed: "High", topAllergens: "Ragweed, Mugwort", note: "Ragweed peaks in September. First frost ends pollen season." },
  "10": { level: "Moderate", tree: "None", grass: "Low", weed: "High", topAllergens: "Ragweed, Mugwort", note: "Ragweed peaks in September. First frost ends pollen season." },
  "11": { level: "Low", tree: "None", grass: "None", weed: "Low", note: "Pollen season winding down." },
};

export async function fetchPollenForecast(): Promise<PollenForecast | null> {
  // Try Tomorrow.io API if key is set
  const apiKey = process.env.TOMORROW_API_KEY;
  if (apiKey) {
    try {
      const url = `https://api.tomorrow.io/v4/timelines?location=40.7128,-74.0060&fields=treeIndex,grassIndex,weedIndex&timesteps=1d&units=metric&apikey=${apiKey}`;
      const res = await fetchWithTimeout(url, { next: { revalidate: 43200 } });
      if (res.ok) {
        const data = await res.json();
        const interval = data?.data?.timelines?.[0]?.intervals?.[0]?.values;
        if (interval) {
          const treeIdx = interval.treeIndex ?? 0;
          const grassIdx = interval.grassIndex ?? 0;
          const weedIdx = interval.weedIndex ?? 0;
          const maxIdx = Math.max(treeIdx, grassIdx, weedIdx);
          const toLevel = (v: number) => v <= 0 ? "None" : v <= 1 ? "Low" : v <= 2 ? "Moderate" : v <= 3 ? "High" : "Very High";
          const level = toLevel(maxIdx);
          const tree = toLevel(treeIdx);
          const grass = toLevel(grassIdx);
          const weed = toLevel(weedIdx);

          const allergens: string[] = [];
          if (treeIdx >= 2) allergens.push("Tree pollen");
          if (grassIdx >= 2) allergens.push("Grass pollen");
          if (weedIdx >= 2) allergens.push("Weed pollen");

          return {
            level, tree, grass, weed,
            topAllergens: allergens.length > 0 ? allergens.join(", ") : undefined,
            note: level === "None" ? "No significant pollen detected today."
              : level === "Low" ? "Low pollen — good day for outdoor activities."
              : level === "Moderate" ? "Moderate pollen — allergy sufferers may want to take medication."
              : "High pollen — limit outdoor time if you have allergies.",
            source: "tomorrow.io",
          };
        }
      }
    } catch { /* fall through to seasonal */ }
  }

  // Seasonal fallback based on current month
  const month = String(new Date().getMonth() + 1);
  const seasonal = SEASONAL_POLLEN[month];
  if (!seasonal) return null;
  return { ...seasonal, source: "seasonal-estimate" };
}

// ─── Farmers Markets ──────────────────────────────────────────────────────────

export type FarmersMarket = {
  name: string;
  address: string;
  borough: string;
  lat: number;
  lng: number;
  days: string;
  hours: string;
  acceptsEbt: boolean;
  acceptsSnap: boolean;
};

export async function fetchFarmersMarkets(): Promise<FarmersMarket[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "marketname,streetaddress,borough,latitude,longitude,daysoperation,hoursoperations,ebt,acceptedsnap",
      "$limit": "500",
    });
    const res = await fetchWithTimeout(`${FARMERS_MARKET_API}?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const raw = await res.json() as {
      marketname?: string;
      streetaddress?: string;
      borough?: string;
      latitude?: string;
      longitude?: string;
      daysoperation?: string;
      hoursoperations?: string;
      ebt?: string;
      acceptedsnap?: string;
    }[];
    if (raw.length === 0) return null;

    return raw
      .filter(r => r.marketname && r.borough)
      .map(r => ({
        name: r.marketname!,
        address: r.streetaddress ?? "",
        borough: boroughLabel(r.borough!),
        lat: parseFloat(r.latitude ?? "0") || 0,
        lng: parseFloat(r.longitude ?? "0") || 0,
        days: r.daysoperation ?? "",
        hours: r.hoursoperations ?? "",
        acceptsEbt: /yes|true|1/i.test(r.ebt ?? ""),
        acceptsSnap: /yes|true|1/i.test(r.acceptedsnap ?? ""),
      }))
      .sort((a, b) => a.borough.localeCompare(b.borough) || a.name.localeCompare(b.name));
  } catch { return null; }
}

// ─── Weather + UV (Open-Meteo, free, no key) ────────────────────────────────

export type WeatherUV = {
  tempF: number;
  feelsLikeF: number;
  uvIndex: number;
  weatherCode: number;
  weatherLabel: string;
  humidity: number;
  windMph: number;
};

const WMO_LABELS: Record<number, string> = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy Fog", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
  61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 66: "Freezing Rain", 67: "Heavy Freezing Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow", 77: "Snow Grains",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
  85: "Light Snow Showers", 86: "Snow Showers",
  95: "Thunderstorm", 96: "Thunderstorm + Hail", 99: "Severe Thunderstorm",
};

export async function fetchWeatherUV(): Promise<WeatherUV | null> {
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.006&current=temperature_2m,apparent_temperature,weather_code,uv_index,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York";
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const c = data?.current;
    if (!c) return null;
    const code = c.weather_code ?? 0;
    return {
      tempF: Math.round(c.temperature_2m ?? 0),
      feelsLikeF: Math.round(c.apparent_temperature ?? 0),
      uvIndex: Math.round((c.uv_index ?? 0) * 10) / 10,
      weatherCode: code,
      weatherLabel: WMO_LABELS[code] ?? "Unknown",
      humidity: Math.round(c.relative_humidity_2m ?? 0),
      windMph: Math.round(c.wind_speed_10m ?? 0),
    };
  } catch { return null; }
}

// Server-side data fetching from live NYC/CDC APIs + Census ACS.
// All functions return null on failure — callers fall back to static data.ts values.

const FOOD_API   = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";
const RODENT_API = "https://data.cityofnewyork.us/resource/p937-wjvj.json";
const NYC311     = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json";
const COVID_API  = "https://data.cityofnewyork.us/resource/rc75-m7u3.json";

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
      "$where":  "grade IN('A','N','Z')",
      "$group":  "grade",
      "$order":  "count DESC",
    });
    const res = await fetch(`${FOOD_API}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { grade: string; count: string }[];
    const COLORS: Record<string, string> = { A: "#2dd4a0", N: "#f5c542", Z: "#f59e42" };
    const NAMES:  Record<string, string> = { A: "Grade A", N: "Pending N", Z: "Pending Z" };
    return raw.map(d => ({
      name:  NAMES[d.grade]  ?? d.grade,
      value: parseInt(d.count),
      fill:  COLORS[d.grade] ?? "#6b7a94",
    }));
  } catch { return null; }
}

// ─── Rodent Inspections ───────────────────────────────────────────────────────

export async function fetchRodentByBorough(): Promise<
  { borough: string; total: number; active: number; passed: number }[] | null
> {
  try {
    const params = new URLSearchParams({
      "$select": "borough,result,count(*) as count",
      "$where":  `inspection_date>'${daysAgo(30)}'`,
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
      if (r.includes("active") || r.includes("rat activity")) grouped[b].active += n;
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
      "$where":  `complaint_type like 'Noise%' AND created_date>'${daysAgo(7)}'`,
      "$group":  "borough",
      "$order":  "complaints DESC",
    });
    const res = await fetch(`${NYC311}?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw = await res.json() as { borough: string; complaints: string }[];
    const VALID = new Set(["Bronx","Brooklyn","Manhattan","Queens","Staten Island"]);
    return raw
      .filter(d => VALID.has(d.borough))
      .map(d => ({ borough: boroughLabel(d.borough), complaints: parseInt(d.complaints) }));
  } catch { return null; }
}

export async function fetchNoiseByType(): Promise<{ type: string; count: number; fill: string }[] | null> {
  try {
    const params = new URLSearchParams({
      "$select": "complaint_type,count(*) as count",
      "$where":  `complaint_type like 'Noise%' AND created_date>'${daysAgo(7)}'`,
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
      "$where": `date_of_interest>'${daysAgo(90)}' AND incomplete='0'`,
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

const CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5";

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
    const res = await fetch(url, { next: { revalidate: 86400 * 30 } }); // cache 30 days
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

import { SectionShell } from "@/components/SectionShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "live" | "seed" | "gap";

interface Source {
  name: string;
  status: Status;
  org: string;
  endpoint?: string;
  updateFreq: string;
  rows?: string;
  desc: string;
  methodNote?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATUS_META: Record<Status, { label: string; color: string; dot: string }> = {
  live: { label: "Live API",    color: "#2dd4a0", dot: "bg-hp-green" },
  seed: { label: "Seed Data",   color: "#5b9cf5", dot: "bg-hp-blue"  },
  gap:  { label: "Data Gap",    color: "#f5c542", dot: "bg-hp-yellow"},
};

const SOURCES: { section: string; icon: string; sources: Source[] }[] = [
  {
    section: "Air Quality",
    icon: "🌬️",
    sources: [
      {
        name: "EPA AirNow",
        status: "live",
        org: "U.S. EPA",
        endpoint: "airnowapi.org/aq/observation/zipCode/current/",
        updateFreq: "Hourly",
        desc: "Real-time AQI observations by zip code. We query 10001 (Manhattan), 10451 (Bronx), and 11201 (Brooklyn). Returns PM2.5, O₃, and dominant pollutant with AQI category.",
        methodNote: "Free API key required. Cached hourly server-side via Next.js ISR.",
      },
      {
        name: "NYC Community Air Survey (NYCCAS)",
        status: "seed",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/c3uy-2p5r.json",
        updateFreq: "Annual",
        rows: "5,000+",
        desc: "Annual average PM2.5, NO₂, and O₃ by 42 UHF neighborhood. The gold-standard neighborhood air quality dataset for NYC. 2023 figures used throughout.",
      },
    ],
  },
  {
    section: "COVID-19",
    icon: "🦠",
    sources: [
      {
        name: "NYC COVID-19 Daily Counts",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/rc75-m7u3.json",
        updateFreq: "Daily",
        rows: "2,100+",
        desc: "Daily confirmed + probable cases, COVID-confirmed hospitalizations, and death certificates. Includes borough-prefixed columns (bx_, bk_, mn_, qn_, si_) enabling 90-day borough breakdown without a join.",
        methodNote: "Incomplete records (same-day) excluded via `incomplete='0'` filter. Monthly trend aggregated server-side.",
      },
    ],
  },
  {
    section: "Influenza-Like Illness",
    icon: "🤒",
    sources: [
      {
        name: "NYC Syndromic Surveillance — ILI",
        status: "seed",
        org: "NYC DOHMH EpiQuery",
        updateFreq: "Weekly",
        rows: "525",
        desc: "Weekly % of ER visits with ILI diagnosis (fever ≥100°F + cough/sore throat) by borough. Pulled from 53 sentinel hospitals. Season Wk42 2025 – Wk3 2026.",
        methodNote: "No public REST API — EpiQuery data accessed via web interface and manually updated each season. A civic data gap.",
      },
      {
        name: "Flu Vaccination Rates",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual (season)",
        desc: "Adult flu vaccination rate (%) by borough. 2023–24 season survey of adults 18+. Source: NYC DOHMH Community Health Survey.",
      },
    ],
  },
  {
    section: "Food Safety",
    icon: "🍽️",
    sources: [
      {
        name: "NYC Restaurant Inspection Results",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/43nn-pn8j.json",
        updateFreq: "Hourly",
        rows: "250,000+",
        desc: "Every restaurant inspection since 2010 — violation codes, critical flags, scores, and grades (A/B/C/N/Z). We query critical violations by cuisine, average score by borough, and current grade distribution using SoQL aggregation.",
      },
    ],
  },
  {
    section: "Environmental Health",
    icon: "🐀",
    sources: [
      {
        name: "NYC Rodent Inspection",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/p937-wjvj.json",
        updateFreq: "Hourly",
        rows: "2M+",
        desc: "Every DOHMH rodent inspection result since 2010. Results include Passed, Active Rat Signs, Rat Activity, and Failed. We aggregate the last 30 days by borough.",
      },
      {
        name: "NYC 311 Service Requests",
        status: "live",
        org: "NYC Open Data",
        endpoint: "data.cityofnewyork.us/resource/fhrw-4uyv.json",
        updateFreq: "Hourly",
        rows: "35M+",
        desc: "All 311 complaints since 2010. Noise complaints filtered via `complaint_type like 'Noise%'` and aggregated by borough and type over the last 7 days.",
      },
      {
        name: "NYC DEP Drinking Water Quality",
        status: "seed",
        org: "NYC DEP",
        endpoint: "data.cityofnewyork.us/resource/bkwf-xfky.json",
        updateFreq: "Daily",
        desc: "Free chlorine, turbidity, and coliform test results from the NYC distribution system. 2024 annual averages shown in water quality table.",
      },
      {
        name: "USDA Food Access Atlas",
        status: "seed",
        org: "USDA Economic Research Service",
        updateFreq: "Every 3–5 years",
        desc: "Census-tract level data on food access, low-income populations, and supermarket proximity. Borough % of low-access tracts sourced from 2019 Atlas.",
      },
    ],
  },
  {
    section: "Chronic Disease & Health Behaviors",
    icon: "🏥",
    sources: [
      {
        name: "CDC PLACES",
        status: "seed",
        org: "CDC / Robert Wood Johnson Foundation",
        endpoint: "data.cdc.gov/resource/cwsq-ngmh.json",
        updateFreq: "Annual",
        desc: "29+ health measures modeled to census-tract level from BRFSS survey data. Covers all ~4,700 NYC tracts. Measures include obesity, diabetes, depression, high BP, smoking, physical inactivity, binge drinking, and uninsured.",
        methodNote: "IMPORTANT: These are statistical model estimates — not direct measurements. BRFSS is a phone survey; estimates carry uncertainty, especially at small-area level.",
      },
      {
        name: "NYC DOHMH Asthma Data",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Age-adjusted asthma emergency department visit rate per 10,000 by borough. 2021 data. Source: NYC DOHMH Environment & Health Data Portal.",
      },
      {
        name: "NYC Vital Statistics — Life Expectancy",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Life expectancy at birth by borough. 2019 figures used (pre-COVID baseline). Source: NYC DOHMH Summary of Vital Statistics.",
      },
      {
        name: "NYC Vital Statistics — Preterm Birth",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "% of live births before 37 weeks gestation by borough. 2022 figures. Source: NYC DOHMH Summary of Vital Statistics.",
      },
      {
        name: "NYC FITNESSGRAM — Childhood Obesity",
        status: "seed",
        org: "NYC DOE / DOHMH",
        updateFreq: "Annual",
        desc: "% of K–8 students classified as obese or overweight by borough. 2022 data. Collected during physical education fitness testing.",
      },
      {
        name: "SPARCS Hospital Discharge Data",
        status: "seed",
        org: "NYS DOH",
        updateFreq: "Annual",
        desc: "Statewide Planning and Research Cooperative System. Top ER visit diagnoses use SPARCS discharge counts for NYC facilities. Covers all NYS hospital discharges.",
        methodNote: "Full SPARCS microdata requires a Data Use Agreement. Aggregate counts shown here are from published DOHMH reports.",
      },
      {
        name: "NYC DOHMH Mental Health ED Trend",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Mental health emergency department visit rate per 100,000 population. 2018–2023. Source: NYC DOHMH Epi Data Brief.",
      },
    ],
  },
  {
    section: "Overdose & Lead",
    icon: "💊",
    sources: [
      {
        name: "Drug Poisoning Mortality",
        status: "seed",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/jge6-vp2t.json",
        updateFreq: "Annual",
        desc: "Unintentional drug poisoning deaths by borough, substance, and year. 2017–2024 (2024 is preliminary estimate). Fentanyl involved in ~80% of recent deaths.",
      },
      {
        name: "Child Blood Lead Surveillance",
        status: "seed",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/9kzi-2guh.json",
        updateFreq: "Annual",
        desc: "% of children under 6 with elevated blood lead levels (≥3.5 μg/dL per CDC reference value) by borough and year. 2015–2023.",
      },
    ],
  },
  {
    section: "Demographics",
    icon: "👥",
    sources: [
      {
        name: "U.S. Census ACS 5-Year Estimates (B03002)",
        status: "live" as const,
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2022/acs/acs5",
        updateFreq: "Annual (5-year rolling)",
        desc: "Hispanic or Latino Origin by Race at the county (borough) level. Variables B03002_001E (total), B03002_003E (NH White), B03002_004E (NH Black), B03002_006E (NH Asian), B03002_012E (Hispanic). Queried for all 5 NYC counties (FIPS 005, 047, 061, 081, 085).",
        methodNote: "No API key required for low-volume queries (<500/day). Cached server-side for 30 days (ACS releases annually). 2022 5-year estimates used.",
      },
      {
        name: "U.S. Census ACS 5-Year Estimates (B02015)",
        status: "seed" as const,
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2022/acs/acs5",
        updateFreq: "Annual (5-year rolling)",
        desc: "Asian Alone by Selected Groups (citywide). Covers 20+ distinct Asian subgroups including Indian, Bangladeshi, Chinese, Filipino, Korean, Pakistani, Vietnamese, and others. Grouped into East Asian, South Asian, Southeast Asian, and Other for display.",
        methodNote: "Shown as citywide NYC aggregate. Borough-level subgroup data is available but requires additional processing.",
      },
      {
        name: "NYC DOHMH Community Health Survey (CHS)",
        status: "seed" as const,
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Annual telephone survey of ~10,000 NYC adults. Health disparities data by race/ethnicity: diabetes, obesity, hypertension, uninsured rate, smoking. 2022 figures used. Estimates are weighted to represent NYC adults 18+.",
        methodNote: "IMPORTANT: Survey estimates carry ±2–4 percentage point margin of error. Asian health data may under-represent newer immigrant groups due to language barriers in survey administration.",
      },
      {
        name: "NYC DOHMH Vital Statistics — Life Expectancy by Race",
        status: "seed" as const,
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Life expectancy at birth by race/ethnicity. 2019 pre-COVID baseline. NH Asian: 87.1y, Hispanic: 82.8y, NH White: 81.2y, NH Black: 74.5y. The 12.6-year Asian–Black gap is a key health equity indicator.",
      },
    ],
  },
  {
    section: "Nutrition",
    icon: "🥗",
    sources: [
      {
        name: "CDC NHANES (National)",
        status: "seed",
        org: "CDC / NCHS",
        updateFreq: "Biennial",
        desc: "National Health and Nutrition Examination Survey. 58+ blood biomarkers including vitamin D and iron by race/ethnicity and sex. 2017–2020 cycle used. National data — not NYC-specific.",
        methodNote: "NYC-level biomarker data does not currently exist. NYC HANES (last conducted 2013–14) is the only NYC-specific nutrition survey and is significantly out of date.",
      },
      {
        name: "NYC HANES (2013–14)",
        status: "gap",
        org: "NYU Langone / NYC DOHMH",
        updateFreq: "Not updated since 2014",
        desc: "Blood biomarker survey of ~3,500 NYC adults covering vitamin D, iron, HbA1c, and more. Conducted 2013–14. This is a genuine civic data gap — no equivalent dataset exists for post-2014 NYC.",
        methodNote: "NYC HANES needs to be repeated. A 2025 version would enable neighborhood-level nutritional surveillance that currently does not exist anywhere.",
      },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full"
      style={{ color: meta.color, background: meta.color + "18" }}
    >
      {status === "live" && <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse`} />}
      {meta.label}
    </span>
  );
}

function SourceCard({ s }: { s: Source }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-bold leading-snug">{s.name}</h4>
        <StatusBadge status={s.status} />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2.5">
        <span className="text-[10px] text-dim">{s.org}</span>
        <span className="text-[10px] text-muted">·</span>
        <span className="text-[10px] text-dim">Updates: <strong className="text-text">{s.updateFreq}</strong></span>
        {s.rows && (
          <>
            <span className="text-[10px] text-muted">·</span>
            <span className="text-[10px] text-dim">{s.rows} rows</span>
          </>
        )}
      </div>

      <p className="text-[11px] text-dim leading-relaxed mb-2">{s.desc}</p>

      {s.endpoint && (
        <code className="block text-[10px] text-hp-cyan bg-hp-cyan/5 border border-hp-cyan/15 rounded px-2 py-1 break-all mb-2">
          {s.endpoint}
        </code>
      )}

      {s.methodNote && (
        <p className="text-[10px] text-hp-yellow leading-relaxed border-l-2 border-hp-yellow/40 pl-2">
          {s.methodNote}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SourcesPage() {
  const liveCount = SOURCES.flatMap(s => s.sources).filter(s => s.status === "live").length;
  const seedCount = SOURCES.flatMap(s => s.sources).filter(s => s.status === "seed").length;
  const gapCount  = SOURCES.flatMap(s => s.sources).filter(s => s.status === "gap").length;
  const total     = liveCount + seedCount + gapCount;

  return (
    <SectionShell
      icon="📡"
      title="Data Sources & Methodology"
      description="Every dataset, API endpoint, and methodology note behind NYC Health Pulse"
      accentColor="rgba(244,114,182,.12)"
    >
      {/* Legend + summary */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hp-green animate-pulse" />
            <span className="text-xs"><strong className="text-hp-green">{liveCount} Live APIs</strong> <span className="text-dim">— data refreshes automatically</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hp-blue" />
            <span className="text-xs"><strong className="text-hp-blue">{seedCount} Seed datasets</strong> <span className="text-dim">— real published figures, manually updated</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hp-yellow" />
            <span className="text-xs"><strong className="text-hp-yellow">{gapCount} Data gap{gapCount !== 1 ? "s" : ""}</strong> <span className="text-dim">— publicly documented limitations</span></span>
          </div>
        </div>
        <p className="text-[11px] text-dim leading-relaxed">
          All <strong className="text-text">{total} sources</strong> are free, public, and either API-accessible or downloadable.
          No data is fabricated — every figure traces to a published government or research dataset.
          Seed data is updated when agencies release new annual figures.
        </p>
      </div>

      {/* Sections */}
      {SOURCES.map(({ section, icon, sources }) => (
        <div key={section} className="mb-8">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <span>{icon}</span>
            <span>{section}</span>
            <span className="text-[10px] font-normal text-muted ml-1">
              {sources.length} source{sources.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sources.map(s => <SourceCard key={s.name} s={s} />)}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div className="bg-surface border border-border rounded-xl p-4 mt-2">
        <h3 className="text-[13px] font-bold mb-2">Borough Map Boundaries</h3>
        <p className="text-[11px] text-dim leading-relaxed">
          Borough polygon GeoJSON bundled from{" "}
          <code className="text-hp-cyan text-[10px]">github.com/dwillis/nyc-maps</code> (NYC Planning,
          public domain). Served from Vercel CDN — no external call at runtime.
        </p>
      </div>
    </SectionShell>
  );
}

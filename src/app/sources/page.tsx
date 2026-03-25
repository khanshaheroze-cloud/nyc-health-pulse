import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Data Sources & Methodology — 25+ Live APIs",
  description: "Every dataset, API endpoint, and methodology note behind Pulse NYC. 25+ live APIs from NYC DOHMH, CDC, Census, EPA, and more.",
};
import { SectionShell } from "@/components/SectionShell";

// ─── Types ────────────────────────────────────────────────────────────────────

export const revalidate = 3600;

type Status = "live" | "seed" | "gap";

interface Source {
  name: string;
  status: Status;
  org: string;
  endpoint?: string;
  portalUrl?: string;
  updateFreq: string;
  cacheNote?: string;
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
        portalUrl: "https://docs.airnowapi.org/",
        updateFreq: "Hourly",
        cacheNote: "Server cache: 1 hour",
        desc: "Real-time AQI observations by zip code. We query 10001 (Manhattan), 10451 (Bronx), and 11201 (Brooklyn). Returns PM2.5, O₃, and dominant pollutant with AQI category.",
        methodNote: "Free API key required (AIRNOW_API_KEY env var). Cached hourly server-side via Next.js ISR.",
      },
      {
        name: "NYC Community Air Survey (NYCCAS)",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/c3uy-2p5r.json",
        portalUrl: "https://data.cityofnewyork.us/d/c3uy-2p5r",
        updateFreq: "Annual (dataset updated continuously)",
        cacheNote: "Server cache: 24 hours",
        rows: "5,000+",
        desc: "Annual average PM2.5, NO₂, and O₃ by 42 UHF neighborhood, 5 boroughs, and citywide. Live-queried and filtered to the most recent annual period. Used for neighborhood PM2.5 chart, borough pollutant breakdown, and citywide PM2.5 KPI.",
        methodNote: "Prefers rows where time_period contains 'annual'. Falls back to latest available period if no annual rows found.",
      },
    ],
  },
  {
    section: "COVID-19",
    icon: "🦠",
    sources: [
      {
        name: "NYC DEP Wastewater SARS-CoV-2 Surveillance",
        status: "live",
        org: "NYC DEP / DOHMH",
        endpoint: "data.cityofnewyork.us/resource/f7dc-2q9f.json",
        portalUrl: "https://data.cityofnewyork.us/d/f7dc-2q9f",
        updateFreq: "Monthly",
        cacheNote: "Server cache: 24 hours",
        rows: "7,400+",
        desc: "SARS-CoV-2 viral load (N1 gene copies/L) from 14 wastewater treatment facilities covering all 5 boroughs. An early warning indicator — wastewater signal typically rises ~1 week before clinical case counts. We average across all sewersheds for the citywide trend.",
        methodNote: "Methodology changed April 2023 from RT-qPCR to digital PCR — values are not directly comparable across that boundary. Current chart shows most recent 6 months only.",
      },
      {
        name: "NYC COVID-19 Daily Counts",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/rc75-m7u3.json",
        portalUrl: "https://data.cityofnewyork.us/d/rc75-m7u3",
        updateFreq: "Daily",
        cacheNote: "Server cache: 24 hours",
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
        name: "CDC NWSS — Influenza A Wastewater Surveillance",
        status: "live",
        org: "CDC / NWSS",
        endpoint: "data.cdc.gov/resource/ymmh-divb.json",
        portalUrl: "https://data.cdc.gov/d/ymmh-divb",
        updateFreq: "Weekly",
        cacheNote: "Server cache: 7 days",
        rows: "550,000+ nationally",
        desc: "Influenza A viral concentration in wastewater from NYC sewersheds. Filtered to NY state with NYC borough FIPS codes. Averaged across sites by sample date. An early-warning signal that can detect flu trends before clinical reporting.",
        methodNote: "Filtered to pcr_target='fluav' and copies/L wastewater units. NYC FIPS: 36005 (Bronx), 36047 (Kings), 36061 (New York), 36081 (Queens), 36085 (Richmond). 6-month rolling window.",
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
        portalUrl: "https://data.cityofnewyork.us/d/43nn-pn8j",
        updateFreq: "Hourly",
        cacheNote: "Server cache: 1 hour",
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
        portalUrl: "https://data.cityofnewyork.us/d/p937-wjvj",
        updateFreq: "Hourly",
        cacheNote: "Server cache: 1 hour",
        rows: "2M+",
        desc: "Every DOHMH rodent inspection result since 2010. Results include Passed, Active Rat Signs, Rat Activity, and Failed. We aggregate the last 30 days by borough.",
      },
      {
        name: "NYC 311 Service Requests",
        status: "live",
        org: "NYC Open Data",
        endpoint: "data.cityofnewyork.us/resource/fhrw-4uyv.json",
        portalUrl: "https://data.cityofnewyork.us/d/erm2-nwe9",
        updateFreq: "Hourly",
        cacheNote: "Server cache: 1 hour",
        rows: "35M+",
        desc: "All 311 complaints since 2010. Noise complaints filtered via `complaint_type like 'Noise%'` and aggregated by borough and type over the last 7 days. Also shown on neighborhood detail pages filtered to the relevant borough.",
      },
      {
        name: "NYC DEP Drinking Water Quality",
        status: "live",
        org: "NYC DEP",
        endpoint: "data.cityofnewyork.us/resource/bkwf-xfky.json",
        portalUrl: "https://data.cityofnewyork.us/d/bkwf-xfky",
        updateFreq: "Daily",
        cacheNote: "Server cache: 24 hours",
        rows: "500K+",
        desc: "Live distribution monitoring data: free chlorine (mg/L), turbidity (NTU), fluoride (mg/L), and coliform/E. coli results from sampling sites across the city. We average the last 30 days of Operational samples to populate the water quality table.",
        methodNote: "Filtered to sample_class='Operational'. Coliform is reported as '<1' for non-detects; we count numeric values ≥1 as detections.",
      },
      {
        name: "USDA Food Access Atlas",
        status: "seed",
        org: "USDA Economic Research Service",
        updateFreq: "Every 3–5 years",
        desc: "Census-tract level data on food access, low-income populations, and supermarket proximity. Borough % of low-access tracts sourced from 2019 Atlas.",
      },
      {
        name: "NYC DOHMH Beach Water Samples",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/2xir-kwzz.json",
        portalUrl: "https://data.cityofnewyork.us/d/2xir-kwzz",
        updateFreq: "Seasonal (Apr–Sep)",
        cacheNote: "Server cache: 24 hours",
        desc: "Enterococci bacteria levels at ~20 NYC beaches. EPA advisory threshold is 104 MPN/100ml — above that, swimming is not recommended. Sampled April–September by the DOHMH Beach Surveillance Program.",
        methodNote: "No explicit pass/fail field in the data. We derive beach safety from the EPA Recreational Water Quality Criterion: ≤104 enterococci MPN/100ml = safe.",
      },
      {
        name: "DOHMH Dog Bite Data",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/rsgh-akpg.json",
        portalUrl: "https://data.cityofnewyork.us/d/rsgh-akpg",
        updateFreq: "Daily",
        cacheNote: "Server cache: 24 hours",
        desc: "Every reported dog bite incident in NYC since 2015. We aggregate the last 12 months by borough and identify the top breed (excluding Unknown/Mixed) per borough.",
      },
      {
        name: "EMS Incident Dispatch Data",
        status: "live",
        org: "NYC Open Data / FDNY",
        endpoint: "data.cityofnewyork.us/resource/76xm-jjuj.json",
        portalUrl: "https://data.cityofnewyork.us/d/76xm-jjuj",
        updateFreq: "Daily",
        cacheNote: "Server cache: 24 hours",
        rows: "25M+",
        desc: "Every EMS incident dispatch with response times in seconds. We average incident_response_seconds_qy (dispatch to on-scene) by borough for the last 12 months. Only includes validated response times (valid_incident_rspns_time_indc='Y').",
        methodNote: "Response time = time from 911 call received to first unit arriving on scene. Excludes invalid/missing response times.",
      },
    ],
  },
  {
    section: "Chronic Disease & Health Behaviors",
    icon: "🏥",
    sources: [
      {
        name: "CDC PLACES — County Estimates (2025 release)",
        status: "live",
        org: "CDC / Robert Wood Johnson Foundation",
        endpoint: "data.cdc.gov/resource/swc5-untb.json",
        portalUrl: "https://data.cdc.gov/d/swc5-untb",
        updateFreq: "Annual",
        cacheNote: "Server cache: 7 days",
        rows: "3,200+",
        desc: "Age-adjusted prevalence estimates for all 5 NYC counties. We fetch datavaluetypeid=AgeAdjPrv for 8 measures: obesity (OBESITY), diabetes (DIABETES), depression (DEPRESSION), current asthma (CASTHMA), smoking (CSMOKING), physical inactivity (LPA), high blood pressure (BPHIGH), and no health insurance (ACCESS2).",
        methodNote: "These are BRFSS model estimates — not direct measurements. We filter server-side to NYC county FIPS codes: 36005 (Bronx), 36047 (Kings/Brooklyn), 36061 (New York/Manhattan), 36081 (Queens), 36085 (Richmond/Staten Island).",
      },
      {
        name: "CDC PLACES — Census Tract Estimates",
        status: "live",
        org: "CDC / Robert Wood Johnson Foundation",
        endpoint: "data.cdc.gov/resource/cwsq-ngmh.json",
        updateFreq: "Annual",
        cacheNote: "Server cache: 7 days",
        rows: "~4,700 NYC tracts",
        desc: "Model-based estimates for ~4,700 NYC census tracts used in the neighborhood CDC PLACES choropleth map. Five measures displayed: OBESITY, DIABETES, CSMOKING, DEPRESSION, and ACCESS2.",
        methodNote: "Served via internal /api/places proxy route (revalidates weekly). Tract GeoJSON bundled in public/nyc-tracts.json.",
      },
      {
        name: "NYC DOHMH Vital Statistics — Leading Causes of Death",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/jb7j-dtam.json",
        portalUrl: "https://data.cityofnewyork.us/d/jb7j-dtam",
        updateFreq: "Annual",
        cacheNote: "Server cache: 7 days",
        rows: "2,000+",
        desc: "Age-adjusted death rates and counts for leading causes by sex and race/ethnicity. We filter sex='Total', group by cause, take the most recent year, and display the top 8 by death count.",
        methodNote: "Cause names include ICD-10 codes which are stripped for display.",
      },
      {
        name: "NYC DOHMH HIV/AIDS Surveillance",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/ykvb-493p.json",
        portalUrl: "https://data.cityofnewyork.us/d/ykvb-493p",
        updateFreq: "Annual",
        cacheNote: "Server cache: 7 days",
        rows: "10,000+",
        desc: "Annual HIV diagnoses, death counts, and diagnosis rates per 100,000 by borough, neighborhood, sex, and race/ethnicity. We filter to borough-level totals for the most recent year.",
        methodNote: "Looks for rows where neighborhood='All' for borough totals; falls back to summing neighborhood rows per borough if not found.",
      },
      {
        name: "NYC DOHMH — Overdose Deaths by UHF42 Neighborhood",
        status: "seed",
        org: "NYC DOHMH",
        portalUrl: "https://www.nyc.gov/site/doh/data/data-publications/epi-data-briefs-and-data-tables.page",
        updateFreq: "Annual",
        rows: "42 neighborhoods",
        desc: "Age-adjusted unintentional drug poisoning (overdose) death rate per 100,000 by UHF42 neighborhood of residence. 2023 data (provisional). Sourced from Epi Data Brief No. 150 (October 2025). Fentanyl involved in 80% of deaths. Range: 12.2 (Greenwich Village/SoHo) to 134.8 (Hunts Point/Mott Haven) per 100K.",
        methodNote: "No public REST API — neighborhood-level rates are published only in DOHMH Epi Data Brief PDFs. Data extracted from the data tables accompanying Brief No. 150. 2023 figures are provisional and subject to revision.",
      },
      {
        name: "NYC DOHMH EHDP — Preterm Births by UHF42 Neighborhood",
        status: "seed",
        org: "NYC DOHMH",
        portalUrl: "https://a816-dohbesp.nyc.gov/IndicatorPublic/data-explorer/birth-outcomes/?id=1",
        updateFreq: "Annual",
        rows: "42 neighborhoods",
        desc: "Percentage of singleton live births before 37 weeks gestational age by UHF42 neighborhood. 2020 data (most recent available at UHF42 level). Range: 5.3% (Greenpoint / Greenwich Village) to 14.0% (Northeast Bronx). Citywide average: 8.8%.",
        methodNote: "Data sourced from the NYC DOHMH Environment & Health Data Portal (EHDP), indicator ID 1 (MeasureID 2 = rate). The EHDP data is published via GitHub (nychealth/EHDP-data) and updated annually but UHF42-level data currently extends only through 2020.",
      },
      {
        name: "NYC DOHMH Asthma Data",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Age-adjusted asthma emergency department visit rate per 10,000 by borough. 2021 data. Source: NYC DOHMH Environment & Health Data Portal.",
      },
      {
        name: "NYC Vital Statistics — Life Expectancy by Borough",
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
    section: "Demographics",
    icon: "👥",
    sources: [
      {
        name: "U.S. Census ACS 5-Year — Race & Ethnicity (B03002)",
        status: "live",
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2023/acs/acs5",
        portalUrl: "https://www.census.gov/data/developers/data-sets/acs-5year.html",
        updateFreq: "Annual (5-year rolling)",
        cacheNote: "Server cache: 30 days",
        desc: "Hispanic or Latino Origin by Race at county (borough) level. Variables B03002_001E (total), _003E (NH White), _004E (NH Black), _006E (NH Asian), _012E (Hispanic). Queried for all 5 NYC counties.",
        methodNote: "No API key required for low-volume queries (<500/day). Cached 30 days.",
      },
      {
        name: "U.S. Census ACS 5-Year — Poverty Rate (B17001)",
        status: "live",
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2023/acs/acs5",
        updateFreq: "Annual (5-year rolling)",
        cacheNote: "Server cache: 30 days",
        desc: "Poverty status in the past 12 months. B17001_001E (total) and B17001_002E (below poverty level) used to compute borough poverty rate %. Displayed on Demographics page.",
      },
      {
        name: "U.S. Census ACS 5-Year — Median Household Income (B19013)",
        status: "live",
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2023/acs/acs5",
        updateFreq: "Annual (5-year rolling)",
        cacheNote: "Server cache: 30 days",
        desc: "Median household income in the past 12 months (in inflation-adjusted dollars). B19013_001E per county. Displayed on Demographics page.",
      },
      {
        name: "U.S. Census ACS 5-Year — Uninsured Rate (S2701)",
        status: "live",
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2023/acs/acs5/subject",
        updateFreq: "Annual (5-year rolling)",
        cacheNote: "Server cache: 30 days",
        desc: "Health insurance coverage status. S2701_C04_001E (uninsured count) and S2701_C01_001E (total civilian population) used to compute borough uninsured rate %. Displayed on Demographics page.",
        methodNote: "Uses the ACS Subject Tables endpoint (/acs5/subject) rather than the detailed tables endpoint.",
      },
      {
        name: "U.S. Census ACS 5-Year — Asian Subgroups (B02015)",
        status: "seed",
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2023/acs/acs5",
        updateFreq: "Annual (5-year rolling)",
        desc: "Asian Alone by Selected Groups (citywide). Covers 20+ distinct Asian subgroups including Indian, Bangladeshi, Chinese, Filipino, Korean, Pakistani, Vietnamese, and others.",
        methodNote: "Shown as citywide NYC aggregate. Borough-level subgroup data is available but requires additional processing.",
      },
      {
        name: "NYC DOHMH Community Health Survey (CHS)",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Annual telephone survey of ~10,000 NYC adults. Health disparities data by race/ethnicity: diabetes, obesity, hypertension, uninsured rate, smoking. 2022 figures used.",
        methodNote: "Survey estimates carry ±2–4 percentage point margin of error. Asian health data may under-represent newer immigrant groups.",
      },
      {
        name: "NYC DOHMH Vital Statistics — Life Expectancy by Race",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "Life expectancy at birth by race/ethnicity. 2019 pre-COVID baseline. NH Asian: 87.1y, Hispanic: 82.8y, NH White: 81.2y, NH Black: 74.5y. The 12.6-year Asian–Black gap is a key health equity indicator.",
      },
    ],
  },
  {
    section: "Maternal Health",
    icon: "🤰",
    sources: [
      {
        name: "NYC Pregnancy-Associated Mortality",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/27x4-cbi6.json",
        portalUrl: "https://data.cityofnewyork.us/d/27x4-cbi6",
        updateFreq: "Annual",
        cacheNote: "Server cache: 30 days",
        rows: "236",
        desc: "Pregnancy-associated deaths by underlying cause, race/ethnicity, and borough. Categories include cardiovascular, hemorrhage, sepsis, mental health/overdose, hypertension, embolism, and homicide. 2016–2017 data.",
        methodNote: "Filtered to related='Pregnancy-Related' (excludes pregnancy-associated but not caused by pregnancy). Data reveals stark racial disparities — Non-Hispanic Black women die at 8–12x the rate of white and Asian women.",
      },
      {
        name: "NYC Infant Mortality by Maternal Race/Ethnicity",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/fcau-jc6k.json",
        portalUrl: "https://data.cityofnewyork.us/d/fcau-jc6k",
        updateFreq: "Annual",
        cacheNote: "Server cache: 30 days",
        rows: "100+",
        desc: "Infant, neonatal, and postneonatal mortality rates per 1,000 live births by maternal race/ethnicity. Shows stark racial disparities — Non-Hispanic Black infant mortality is 3–4x that of Asian/Pacific Islander mothers.",
        methodNote: "Field name has a typo in the source dataset: 'materal_race_or_ethnicity' (missing 'n'). Filtered to most recent year. 'Total' and 'Other and Unknown' rows excluded from charts.",
      },
      {
        name: "NY State Live Births by Method of Delivery",
        status: "live",
        org: "NY State DOH",
        endpoint: "data.ny.gov/resource/ms2r-yf4h.json",
        portalUrl: "https://data.ny.gov/d/ms2r-yf4h",
        updateFreq: "Annual",
        cacheNote: "Server cache: 30 days",
        desc: "Live birth counts by method of delivery (vaginal vs. cesarean) and county of residence. Filtered to NYC counties (New York, Kings, Queens, Bronx, Richmond) to compute borough-level C-section rates.",
        methodNote: "NY State dataset — covers all 62 counties. We filter to 5 NYC counties and compute cesarean percentage = cesarean / (vaginal + cesarean) × 100.",
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
        updateFreq: "Annual",
        desc: "Unintentional drug poisoning deaths by borough, substance, and year. 2017–2024 (2024 is preliminary estimate). Fentanyl involved in ~80% of recent deaths.",
        methodNote: "NYC-specific annual overdose trend data is not available via a public REST API. Figures sourced from published NYC DOHMH Vital Statistics reports.",
      },
      {
        name: "Child Blood Lead Surveillance (Borough Trend)",
        status: "seed",
        org: "NYC DOHMH",
        updateFreq: "Annual",
        desc: "% of children under 6 with elevated blood lead levels by borough and year. 2015–2023. Borough trend chart uses the ≥3.5 μg/dL CDC reference value.",
        methodNote: "Borough-level trend data sourced from published DOHMH surveillance reports. Note: the CDC lowered the reference value from ≥5 to ≥3.5 μg/dL in 2021.",
      },
      {
        name: "Child Blood Lead — UHF42 Neighborhood (Live)",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/tnry-kwh5.json",
        portalUrl: "https://data.cityofnewyork.us/d/tnry-kwh5",
        updateFreq: "Annual",
        cacheNote: "Server cache: 30 days",
        rows: "10,000+",
        desc: "Neighborhood-level childhood blood lead data. Uses field bll_5_total_pct — the percentage of tested children under 6 with blood lead levels ≥5 μg/dL. Shown on individual neighborhood profile pages.",
        methodNote: "Important: this dataset uses the older ≥5 μg/dL threshold, NOT the current CDC reference value of ≥3.5 μg/dL. Rates would be higher if measured at the lower threshold. Filtered to most recent year and UHF42 geography.",
      },
      {
        name: "Heat Vulnerability Index (HVI)",
        status: "live",
        org: "NYC DOHMH",
        endpoint: "data.cityofnewyork.us/resource/4mhf-duep.json",
        portalUrl: "https://data.cityofnewyork.us/d/4mhf-duep",
        updateFreq: "Periodic",
        cacheNote: "Server cache: 30 days",
        desc: "Composite Heat Vulnerability Index score (1–5) by UHF42 neighborhood. Score 1 = lowest vulnerability, 5 = highest. Combines surface temperature, green space, air conditioning access, poverty rate, and proportion of non-Latino Black residents (a proxy for structural racism and health disparities).",
        methodNote: "The HVI is a composite index — not a direct temperature measurement. It identifies neighborhoods where residents face the greatest risk during extreme heat events due to the combination of environmental exposure and social vulnerability. Scores ≥4 are flagged as high risk in neighborhood profiles.",
      },
    ],
  },
  {
    section: "News & Media",
    icon: "📰",
    sources: [
      {
        name: "Google News RSS",
        status: "live",
        org: "Google / Various Publishers",
        endpoint: "news.google.com/rss/search?q=…&hl=en-US&gl=US&ceid=US:en",
        portalUrl: "https://news.google.com/rss/search?q=NYC+health+department&hl=en-US&gl=US&ceid=US:en",
        updateFreq: "Continuous (30-min server cache)",
        cacheNote: "Server cache: 30 minutes",
        desc: "Three RSS queries merged and deduplicated: (1) Local NYC media outlets — Gothamist, NY1, amNY, WNYC, Crain's, City Limits; (2) NYC agency news — DOHMH, NYC Health Department; (3) NYC-specific health alerts and outbreaks. Returns up to 12 headlines with source, timestamp, and link. Priority flag applied to CDC/outbreak/emergency items.",
        methodNote: "RSS XML parsed server-side with regex (no external package). Google News RSS is free and requires no API key. Results from all 3 queries are merged, deduplicated by URL, and cached for 30 minutes. Items with 'CDC', 'alert', 'outbreak', 'emergency', 'advisory', or 'warning' in title/source are surfaced first and highlighted in amber.",
      },
    ],
  },
  {
    section: "Neighborhood Profiles",
    icon: "🗺️",
    sources: [
      {
        name: "NYC DOHMH Environment & Health Data Portal — Asthma ED",
        status: "seed",
        org: "NYC DOHMH",
        endpoint: "a816-dhcm.data.cityofnewyork.us/resource/udc3-5wb5.json",
        portalUrl: "https://a816-dhcm.data.cityofnewyork.us/Environment-Health/Air-Quality/c3uy-2p5r",
        updateFreq: "Annual",
        desc: "Age-adjusted asthma emergency department visit rate per 10,000 residents by UHF42 neighborhood. 2019 figures used. One of the primary health burden indicators in neighborhood profiles.",
      },
      {
        name: "NYC DOHMH Vital Statistics — Life Expectancy by UHF42",
        status: "seed",
        org: "NYC DOHMH",
        portalUrl: "https://www.nyc.gov/site/doh/data/data-publications/summary-of-vital-statistics.page",
        updateFreq: "Annual",
        desc: "Life expectancy at birth by UHF42 neighborhood. 2019 figures (pre-COVID baseline). Ranges from 76.4y (Hunts Point/Mott Haven) to 89.4y (Upper East Side) — a 13-year gap across the city.",
      },
      {
        name: "CDC PLACES — Census Tract (neighborhood-level)",
        status: "live",
        org: "CDC",
        endpoint: "data.cdc.gov/resource/cwsq-ngmh.json",
        portalUrl: "https://data.cdc.gov/d/cwsq-ngmh",
        updateFreq: "Annual",
        cacheNote: "Server cache: 7 days via /api/places",
        desc: "Obesity and diabetes rates mapped to UHF42 neighborhoods via census tract aggregation. 2023 PLACES release. Used for obesity%, diabetes% fields in all 42 neighborhood profiles.",
      },
      {
        name: "U.S. Census ACS 5-Year — Poverty by Neighborhood",
        status: "seed",
        org: "U.S. Census Bureau",
        endpoint: "api.census.gov/data/2023/acs/acs5",
        portalUrl: "https://www.census.gov/data/developers/data-sets/acs-5year.html",
        updateFreq: "Annual (5-year rolling)",
        desc: "Poverty rate (% below federal poverty line) by ZIP code cluster, mapped to UHF42 boundaries. 2022 ACS 5-year estimates. Used for poverty% in neighborhood profiles.",
      },
      {
        name: "UHF42 Boundary GeoJSON",
        status: "seed",
        org: "NYC DOHMH / NYC Planning",
        portalUrl: "https://data.cityofnewyork.us/Health/United-Hospital-Fund-Neighborhoods/jgqm-ccbd",
        updateFreq: "Static — boundaries rarely change",
        desc: "Polygon boundaries for all 42 United Hospital Fund neighborhoods, simplified and bundled at public/uhf42.json (45KB). Used by the Leaflet choropleth map on the Neighborhood Index page. Properties: GEOCODE, GEONAME, BOROUGH.",
        methodNote: "UHF42 was designed to align with ZIP code clusters for hospital discharge data. It is the standard geographic unit for NYC public health surveillance and differs from Community Districts and NTAs.",
      },
    ],
  },
  {
    section: "Nutrition",
    icon: "🥗",
    sources: [
      {
        name: "NYC Youth Risk Behavior Survey (YRBS)",
        status: "live",
        org: "NYC DOHMH / CDC",
        endpoint: "data.cityofnewyork.us/resource/3qty-g4aq.json",
        portalUrl: "https://data.cityofnewyork.us/d/3qty-g4aq",
        updateFreq: "Biennial",
        cacheNote: "Server cache: 30 days",
        rows: "18",
        desc: "Citywide prevalence estimates for NYC high school students (grades 9–12). Tracks adolescent obesity, smoking, binge drinking, daily soda consumption, and physical activity. 2011–2021 biennial trend data.",
        methodNote: "Filtered to rows where prevalence contains 'Prevalence' (excluding CI rows). All values are strings, parsed to floats. Citywide aggregates only — no borough or school-level breakdown available.",
      },
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

      {s.portalUrl && (
        <a
          href={s.portalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[10px] text-hp-blue hover:text-hp-blue/80 transition-colors mb-1"
        >
          View dataset →
        </a>
      )}

      {s.cacheNote && (
        <p className="text-[10px] text-muted mt-1">⟳ {s.cacheNote}</p>
      )}

      {s.methodNote && (
        <p className="text-[10px] text-hp-yellow leading-relaxed border-l-2 border-hp-yellow/40 pl-2 mt-2">
          {s.methodNote}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SourcesPage() {
  const liveCount = SOURCES.flatMap(s => s.sources).filter(s => s.status === "live").length;
  const seedCount = SOURCES.flatMap(s => s.sources).filter(s => s.status === "seed").length;
  const gapCount  = SOURCES.flatMap(s => s.sources).filter(s => s.status === "gap").length;
  const total     = liveCount + seedCount + gapCount;
  const rendered  = new Date().toUTCString();

  return (
    <SectionShell
      icon="📡"
      title="Data Sources & Methodology"
      description="Every dataset, API endpoint, and methodology note behind Pulse NYC"
      accentColor="rgba(244,114,182,.12)"
    >
      {/* Legend + summary */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hp-green live-pulse" />
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
        <p className="text-[10px] text-muted mt-2">Page last rendered: {rendered} · refreshes hourly via ISR</p>
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

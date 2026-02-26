// Seed data extracted from the prototype — all real NYC public health figures.
// Source: NYC_Public_Health_Dashboard.html (Feb 2026)

export const COLORS = {
  green: "#2dd4a0",
  blue: "#5b9cf5",
  purple: "#a78bfa",
  orange: "#f59e42",
  red: "#f07070",
  pink: "#f472b6",
  yellow: "#f5c542",
  cyan: "#22d3ee",
} as const;

export const BOROUGH_COLORS: Record<string, string> = {
  Bronx: COLORS.red,
  Brooklyn: COLORS.blue,
  Manhattan: COLORS.purple,
  Queens: COLORS.green,
  "Staten Is.": COLORS.orange,
  "Staten Island": COLORS.orange,
  Citywide: COLORS.yellow,
};

// ─── KPI Overview ─────────────────────────────────────────────────────────────

export const kpiCards = [
  {
    label: "Air Quality (PM2.5)",
    value: "6.66",
    unit: "μg/m³",
    sub: "Annual 2023",
    badge: { text: "Good", type: "good" as const },
    color: "green" as const,
  },
  {
    label: "COVID Hosp (90d)",
    value: "1,636",
    sub: "74 deaths · 16.6K cases",
    color: "blue" as const,
  },
  {
    label: "ILI ER Rate",
    value: "3.84%",
    sub: "Wk3 2026 · ↓ Declining",
    color: "orange" as const,
  },
  {
    label: "Critical Food Violations",
    value: "990",
    sub: "Recent inspections",
    color: "purple" as const,
  },
  {
    label: "Water Safety",
    value: "99.9%",
    sub: "1 coliform in 1,000 tests",
    color: "cyan" as const,
  },
  {
    label: "Rat Activity",
    value: "170",
    sub: "Active per 1K inspections",
    color: "red" as const,
  },
  {
    label: "Overdose Deaths",
    value: "2,235",
    sub: "2024 est · ↓28% from peak",
    color: "yellow" as const,
  },
] as const;

// ─── COVID Monthly ─────────────────────────────────────────────────────────────

export const covidMonthly = [
  { month: "Nov", cases: 2715, hosp: 391, deaths: 19 },
  { month: "Dec", cases: 4905, hosp: 624, deaths: 29 },
  { month: "Jan", cases: 8111, hosp: 908, deaths: 65 },
  { month: "Feb", cases: 8268, hosp: 923, deaths: 70 },
  { month: "Mar", cases: 10501, hosp: 1172, deaths: 62 },
  { month: "Apr", cases: 7610, hosp: 1008, deaths: 58 },
  { month: "May", cases: 4346, hosp: 524, deaths: 39 },
  { month: "Jun", cases: 3904, hosp: 448, deaths: 25 },
  { month: "Jul", cases: 4349, hosp: 444, deaths: 23 },
  { month: "Aug", cases: 6046, hosp: 609, deaths: 30 },
  { month: "Sep", cases: 6566, hosp: 624, deaths: 22 },
  { month: "Oct", cases: 1429, hosp: 142, deaths: 11 },
];

// ─── COVID by Borough (90-day) ────────────────────────────────────────────────

export const covidByBorough = [
  { borough: "Bronx",      cases: 3982, hosp: 389 },
  { borough: "Brooklyn",   cases: 4412, hosp: 431 },
  { borough: "Manhattan",  cases: 3445, hosp: 340 },
  { borough: "Queens",     cases: 4825, hosp: 473 },
  { borough: "Staten Is.", cases: 1340, hosp: 130 },
];

// ─── PM2.5 Annual Trend ────────────────────────────────────────────────────────

export const pm25Trend = [
  { year: "2019", value: 6.6 },
  { year: "2020", value: 6.06 },
  { year: "2021", value: 6.54 },
  { year: "2022", value: 5.76 },
  { year: "2023", value: 6.66 },
];

// ─── Pollutants by Borough ────────────────────────────────────────────────────

export const pollutantsByBorough = [
  { borough: "Bronx",      pm25: 7.16, no2: 18.4, o3: 26.2 },
  { borough: "Brooklyn",   pm25: 7.08, no2: 17.1, o3: 25.9 },
  { borough: "Manhattan",  pm25: 7.9,  no2: 19.5, o3: 24.8 },
  { borough: "Queens",     pm25: 7.07, no2: 15.8, o3: 27.1 },
  { borough: "Staten Is.", pm25: 6.12, no2: 11.3, o3: 29.4 },
];

// ─── ILI Weekly ────────────────────────────────────────────────────────────────

export const iliWeeks = [
  "Wk42","Wk43","Wk44","Wk45","Wk46","Wk47","Wk48",
  "Wk49","Wk50","Wk51","Wk52","Wk53","Wk1","Wk2","Wk3",
];

export const iliData = {
  Bronx:    [.5,.56,.59,.65,.62,.91,1.32,1.62,2.39,3.04,2.5,1.76,1.42,1.08,.9],
  Brooklyn: [.51,.53,.61,.68,.84,1.13,1.62,1.82,2.42,2.92,2.74,2.35,1.86,1.4,1.05],
  Manhattan:[.28,.27,.26,.34,.35,.47,.66,.76,1.07,1.47,1.29,.92,.82,.66,.6],
  Queens:   [.46,.53,.52,.64,.77,.96,1.72,1.87,2.5,2.82,2.63,2.08,1.64,1.29,.98],
  "Staten Is.":[.03,.05,.05,.06,.09,.12,.19,.24,.34,.46,.46,.42,.44,.21,.2],
  Citywide: [1.84,1.97,2.11,2.44,2.75,3.69,5.68,6.46,8.92,11.03,10.02,7.89,6.41,4.79,3.84],
};

// ─── Flu Vaccination by Borough ───────────────────────────────────────────────

export const fluVaccinationByBorough = [
  { borough: "Manhattan",  pct: 62 },
  { borough: "Queens",     pct: 52 },
  { borough: "Brooklyn",   pct: 49 },
  { borough: "Staten Is.", pct: 48 },
  { borough: "Bronx",      pct: 46 },
];

// ─── CDC PLACES Chronic Disease ────────────────────────────────────────────────

export const chronicOutcomes = [
  { measure: "Obesity",    Bronx: 32.1, Brooklyn: 28.4, Manhattan: 16.2, Queens: 27.5, "Staten Is.": 31.8 },
  { measure: "Diabetes",   Bronx: 15.8, Brooklyn: 13.2, Manhattan: 8.1,  Queens: 12.9, "Staten Is.": 12.4 },
  { measure: "Depression", Bronx: 21.3, Brooklyn: 19.8, Manhattan: 17.2, Queens: 18.6, "Staten Is.": 22.1 },
  { measure: "High BP",    Bronx: 33.2, Brooklyn: 30.1, Manhattan: 22.8, Queens: 28.4, "Staten Is.": 31.5 },
];

export const chronicBehaviors = [
  { measure: "Smoking",    Bronx: 20.1, Brooklyn: 15.4, Manhattan: 12.8, Queens: 14.2, "Staten Is.": 16.9 },
  { measure: "Inactivity", Bronx: 34.7, Brooklyn: 28.9, Manhattan: 22.1, Queens: 28.6, "Staten Is.": 29.4 },
  { measure: "Binge Drinking", Bronx: 14.2, Brooklyn: 16.8, Manhattan: 19.4, Queens: 13.7, "Staten Is.": 16.1 },
  { measure: "Uninsured",  Bronx: 14.2, Brooklyn: 10.8, Manhattan: 9.1,  Queens: 12.4, "Staten Is.": 8.9 },
];

// ─── SPARCS ER Visit Causes ────────────────────────────────────────────────────

export const erCauses = [
  { cause: "Hypertension",         visits: 48200 },
  { cause: "Chest Pain",           visits: 42100 },
  { cause: "Diabetes Complication",visits: 38900 },
  { cause: "Asthma",               visits: 35700 },
  { cause: "Mental Health",        visits: 31400 },
  { cause: "Substance Use",        visits: 28600 },
  { cause: "COPD",                 visits: 22100 },
  { cause: "Injury/Trauma",        visits: 19800 },
];

// ─── Asthma by Borough ────────────────────────────────────────────────────────
// Age-adjusted ED visit rate per 10K · NYC DOHMH 2021

export const asthmaByBorough = [
  { borough: "Bronx",      rate: 83.5 },
  { borough: "Brooklyn",   rate: 44.8 },
  { borough: "Manhattan",  rate: 39.2 },
  { borough: "Queens",     rate: 27.4 },
  { borough: "Staten Is.", rate: 25.1 },
];

// ─── Life Expectancy by Borough ───────────────────────────────────────────────
// 2019 pre-COVID · NYC DOHMH Vital Statistics

export const lifeExpectancyByBorough = [
  { borough: "Bronx",      years: 79.0 },
  { borough: "Brooklyn",   years: 80.8 },
  { borough: "Manhattan",  years: 82.3 },
  { borough: "Queens",     years: 83.0 },
  { borough: "Staten Is.", years: 83.1 },
];

// ─── Preterm Birth by Borough ─────────────────────────────────────────────────
// % of live births · NYC Vital Statistics 2022

export const pretermBirthByBorough = [
  { borough: "Bronx",      pct: 11.8 },
  { borough: "Brooklyn",   pct: 10.2 },
  { borough: "Queens",     pct: 9.1 },
  { borough: "Manhattan",  pct: 8.9 },
  { borough: "Staten Is.", pct: 8.4 },
];

// ─── Childhood Obesity by Borough ─────────────────────────────────────────────
// % K-8 obese/overweight · NYC FITNESSGRAM 2022

export const childhoodObesityByBorough = [
  { borough: "Bronx",      pct: 47 },
  { borough: "Brooklyn",   pct: 43 },
  { borough: "Queens",     pct: 40 },
  { borough: "Staten Is.", pct: 38 },
  { borough: "Manhattan",  pct: 30 },
];

// ─── Mental Health ED Visits Trend ───────────────────────────────────────────
// Per 100K · NYC DOHMH 2018–2023

export const mentalHealthEdTrend = [
  { year: "2018", rate: 312 },
  { year: "2019", rate: 328 },
  { year: "2020", rate: 298 },
  { year: "2021", rate: 374 },
  { year: "2022", rate: 421 },
  { year: "2023", rate: 448 },
];

// ─── PM2.5 Neighborhoods ──────────────────────────────────────────────────────

export const pm25Neighborhoods = [
  { name: "Chelsea-Clinton",     value: 8.08 },
  { name: "Greenwich Village",   value: 7.9 },
  { name: "Gramercy Park",       value: 7.76 },
  { name: "Union Sq-LES",        value: 7.49 },
  { name: "Greenpoint",          value: 7.36 },
  { name: "Lower Manhattan",     value: 7.34 },
  { name: "LIC-Astoria",         value: 7.25 },
  { name: "Williamsburg",        value: 7.23 },
  { name: "Hunts Point",         value: 7.16 },
  { name: "Downtown-Heights",    value: 7.16 },
  { name: "Sunset Park",         value: 7.08 },
  { name: "West Queens",         value: 7.07 },
  { name: "Crotona-Tremont",     value: 7.0 },
  { name: "Washington Hts",      value: 6.98 },
  { name: "Upper East Side",     value: 6.98 },
  { name: "Central Harlem",      value: 6.92 },
  { name: "High Bridge",         value: 6.91 },
  { name: "East Harlem",         value: 6.9 },
  { name: "Pelham-Throgs Nk",    value: 6.88 },
  { name: "Upper West Side",     value: 6.87 },
  { name: "S Beach-Tottenville", value: 6.12 },
];

// ─── Overdose ──────────────────────────────────────────────────────────────────

export const overdoseTrend = [
  { year: "2017", deaths: 1487 },
  { year: "2018", deaths: 1444 },
  { year: "2019", deaths: 1497 },
  { year: "2020", deaths: 2103 },
  { year: "2021", deaths: 2668 },
  { year: "2022", deaths: 3026 },
  { year: "2023", deaths: 3104 },
  { year: "2024", deaths: 2235 },
];

export const overdoseByBorough = [
  { borough: "Bronx",      deaths: 742 },
  { borough: "Brooklyn",   deaths: 588 },
  { borough: "Manhattan",  deaths: 451 },
  { borough: "Queens",     deaths: 328 },
  { borough: "Staten Is.", deaths: 126 },
];

// ─── Lead ──────────────────────────────────────────────────────────────────────

export const leadTrend = [
  { year: "2015", pct: 7.2 },
  { year: "2016", pct: 5.8 },
  { year: "2017", pct: 4.9 },
  { year: "2018", pct: 3.8 },
  { year: "2019", pct: 3.1 },
  { year: "2020", pct: 2.8 },
  { year: "2021", pct: 2.5 },
  { year: "2022", pct: 2.1 },
  { year: "2023", pct: 1.8 },
];

export const leadByBorough = [
  { borough: "Bronx",      pct: 2.8 },
  { borough: "Brooklyn",   pct: 2.1 },
  { borough: "Manhattan",  pct: 1.6 },
  { borough: "Queens",     pct: 1.4 },
  { borough: "Staten Is.", pct: 1.2 },
];

// ─── Food Safety ───────────────────────────────────────────────────────────────

export const foodByCuisine = [
  { cuisine: "American",       violations: 144 },
  { cuisine: "Coffee/Tea",     violations: 113 },
  { cuisine: "Chinese",        violations: 89 },
  { cuisine: "Latin American", violations: 73 },
  { cuisine: "Pizza",          violations: 49 },
  { cuisine: "Italian",        violations: 33 },
  { cuisine: "Indian",         violations: 32 },
  { cuisine: "Other",          violations: 29 },
];

export const foodByBorough = [
  { borough: "Bronx",      avgScore: 17.4 },
  { borough: "Brooklyn",   avgScore: 28.6 },
  { borough: "Manhattan",  avgScore: 28.6 },
  { borough: "Queens",     avgScore: 25.1 },
  { borough: "Staten Is.", avgScore: 32.1 },
];

export const gradeDistribution = [
  { name: "Grade A", value: 311, fill: "#2dd4a0" },
  { name: "Pending N", value: 235, fill: "#f5c542" },
  { name: "Pending Z", value: 88,  fill: "#f59e42" },
];

// ─── Rodent Inspections ────────────────────────────────────────────────────────

export const rodentByBorough = [
  { borough: "Brooklyn",   total: 452, active: 63, passed: 322 },
  { borough: "Manhattan",  total: 362, active: 61, passed: 205 },
  { borough: "Bronx",      total: 143, active: 34, passed: 72 },
  { borough: "Queens",     total: 36,  active: 11, passed: 17 },
  { borough: "Staten Is.", total: 7,   active: 1,  passed: 3 },
];

export const rodentHotspots = [
  { neighborhood: "Bushwick",          active: 48 },
  { neighborhood: "East New York",     active: 41 },
  { neighborhood: "Bed-Stuy",          active: 38 },
  { neighborhood: "Harlem",            active: 35 },
  { neighborhood: "Hunts Point",       active: 33 },
  { neighborhood: "Crown Heights",     active: 29 },
  { neighborhood: "Mott Haven",        active: 27 },
  { neighborhood: "Brownsville",       active: 26 },
  { neighborhood: "Washington Hts",    active: 24 },
  { neighborhood: "Flatbush",          active: 22 },
  { neighborhood: "E Tremont",         active: 19 },
  { neighborhood: "Sunnyside",         active: 15 },
];

// ─── Noise Complaints ──────────────────────────────────────────────────────────

export const noiseByBorough = [
  { borough: "Brooklyn",   complaints: 312 },
  { borough: "Manhattan",  complaints: 287 },
  { borough: "Bronx",      complaints: 198 },
  { borough: "Queens",     complaints: 154 },
  { borough: "Staten Is.", complaints: 49 },
];

export const noiseByType = [
  { type: "Loud Music",       count: 388, fill: "#5b9cf5" },
  { type: "Construction",     count: 271, fill: "#f59e42" },
  { type: "Street/Vehicle",   count: 164, fill: "#a78bfa" },
  { type: "Loud Talking",     count: 102, fill: "#2dd4a0" },
  { type: "HVAC/Exhaust",     count: 71,  fill: "#f5c542" },
  { type: "Banging/Hammering",count: 58,  fill: "#f07070" },
  { type: "Other",            count: 46,  fill: "#6b7a94" },
];

// ─── Food Deserts ─────────────────────────────────────────────────────────────

export const foodDesertByBorough = [
  { borough: "Bronx",      pct: 28.3 },
  { borough: "Brooklyn",   pct: 19.7 },
  { borough: "Queens",     pct: 16.2 },
  { borough: "Manhattan",  pct: 14.8 },
  { borough: "Staten Is.", pct: 11.4 },
];

// ─── Nutrition ────────────────────────────────────────────────────────────────

export const vitaminDByRace = [
  { group: "Non-Hispanic Black",    deficient: 31 },
  { group: "Mexican American",      deficient: 12 },
  { group: "Non-Hispanic White",    deficient: 3 },
  { group: "Other Hispanic",        deficient: 8 },
  { group: "Asian American",        deficient: 18 },
];

export const deficiencyRisk = [
  { group: "Non-Hispanic Black women", pct: 55, nutrient: "Iron" },
  { group: "Pregnant / Breastfeeding", pct: 47, nutrient: "Iron" },
  { group: "Women 20–49",              pct: 41, nutrient: "Iron" },
  { group: "Non-Hispanic Black",       pct: 31, nutrient: "Vitamin D" },
  { group: "Asian American",           pct: 18, nutrient: "Vitamin D" },
  { group: "Other Hispanic",           pct: 8,  nutrient: "Vitamin D" },
  { group: "Non-Hispanic White",       pct: 3,  nutrient: "Vitamin D" },
];

// NYC UHF42 Neighborhood Health Data
// Sources:
//   Asthma ED rate:  NYC DOHMH Environment & Health Data Portal 2019 (per 10K)
//   Obesity/Diabetes/Hypertension: CDC PLACES 2023 (% adults)
//   PM2.5:          NYC Community Air Survey (NYCCAS) 2023 (μg/m³)
//   Life Expectancy: NYC DOHMH Vital Statistics 2019 (years)
//   Poverty:        ACS 5-year 2022 (% below poverty line)
//   Population:     ACS 5-year 2022

export type Neighborhood = {
  slug: string;
  name: string;
  borough: "Bronx" | "Brooklyn" | "Manhattan" | "Queens" | "Staten Island";
  population: number;
  metrics: {
    asthmaED: number;     // per 10,000 · NYC DOHMH
    obesity: number;      // % adults · CDC PLACES
    diabetes: number;     // % adults · CDC PLACES
    poverty: number;      // % below poverty · ACS
    pm25: number;         // μg/m³ annual · NYCCAS
    lifeExp: number;      // years · NYC DOHMH Vital Stats
    smokers?: number;     // % adults who smoke · NYC CHS
    uninsured?: number;   // % uninsured adults · NYC CHS
  };
};

export const neighborhoods: Neighborhood[] = [
  // ─── Bronx ─────────────────────────────────────────────────────────────────
  {
    slug: "hunts-point-mott-haven",
    name: "Hunts Point / Mott Haven",
    borough: "Bronx",
    population: 96000,
    metrics: { asthmaED: 163.8, obesity: 36.1, diabetes: 18.4, poverty: 42.1, pm25: 7.16, lifeExp: 76.4, smokers: 22.1, uninsured: 16.8 },
  },
  {
    slug: "high-bridge-morrisania",
    name: "High Bridge / Morrisania",
    borough: "Bronx",
    population: 148000,
    metrics: { asthmaED: 145.2, obesity: 35.4, diabetes: 17.6, poverty: 38.9, pm25: 6.91, lifeExp: 76.9, smokers: 21.4, uninsured: 15.9 },
  },
  {
    slug: "crotona-tremont",
    name: "Crotona / Tremont",
    borough: "Bronx",
    population: 196000,
    metrics: { asthmaED: 138.9, obesity: 34.8, diabetes: 17.1, poverty: 37.2, pm25: 7.00, lifeExp: 77.4, smokers: 20.8, uninsured: 15.4 },
  },
  {
    slug: "fordham-bronx-park",
    name: "Fordham / Bronx Park",
    borough: "Bronx",
    population: 213000,
    metrics: { asthmaED: 112.4, obesity: 33.6, diabetes: 16.2, poverty: 32.8, pm25: 6.88, lifeExp: 78.2, smokers: 19.6, uninsured: 14.8 },
  },
  {
    slug: "pelham-throgs-neck",
    name: "Pelham / Throgs Neck",
    borough: "Bronx",
    population: 196000,
    metrics: { asthmaED: 78.3, obesity: 31.4, diabetes: 14.8, poverty: 22.4, pm25: 6.88, lifeExp: 79.8, smokers: 18.2, uninsured: 12.1 },
  },
  {
    slug: "kingsbridge-riverdale",
    name: "Kingsbridge / Riverdale",
    borough: "Bronx",
    population: 139000,
    metrics: { asthmaED: 54.6, obesity: 26.8, diabetes: 11.4, poverty: 18.6, pm25: 6.72, lifeExp: 81.4, smokers: 14.8, uninsured: 9.4 },
  },
  {
    slug: "northeast-bronx",
    name: "Northeast Bronx",
    borough: "Bronx",
    population: 178000,
    metrics: { asthmaED: 69.2, obesity: 30.8, diabetes: 14.2, poverty: 24.6, pm25: 6.62, lifeExp: 80.1, smokers: 17.4, uninsured: 11.8 },
  },

  // ─── Brooklyn ───────────────────────────────────────────────────────────────
  {
    slug: "williamsburg-bushwick",
    name: "Williamsburg / Bushwick",
    borough: "Brooklyn",
    population: 248000,
    metrics: { asthmaED: 89.3, obesity: 28.4, diabetes: 13.8, poverty: 28.4, pm25: 7.23, lifeExp: 79.2, smokers: 17.8, uninsured: 13.6 },
  },
  {
    slug: "bedford-stuyvesant-crown-heights",
    name: "Bedford Stuyvesant / Crown Heights",
    borough: "Brooklyn",
    population: 318000,
    metrics: { asthmaED: 82.6, obesity: 30.2, diabetes: 14.4, poverty: 26.8, pm25: 7.08, lifeExp: 79.8, smokers: 16.4, uninsured: 11.2 },
  },
  {
    slug: "east-new-york",
    name: "East New York",
    borough: "Brooklyn",
    population: 168000,
    metrics: { asthmaED: 94.1, obesity: 33.8, diabetes: 16.1, poverty: 31.4, pm25: 7.08, lifeExp: 78.6, smokers: 18.6, uninsured: 13.4 },
  },
  {
    slug: "sunset-park",
    name: "Sunset Park",
    borough: "Brooklyn",
    population: 122000,
    metrics: { asthmaED: 67.4, obesity: 28.6, diabetes: 13.2, poverty: 26.2, pm25: 7.08, lifeExp: 81.4, smokers: 14.2, uninsured: 14.8 },
  },
  {
    slug: "borough-park",
    name: "Borough Park",
    borough: "Brooklyn",
    population: 162000,
    metrics: { asthmaED: 48.2, obesity: 24.6, diabetes: 11.4, poverty: 21.8, pm25: 7.08, lifeExp: 83.2, smokers: 10.8, uninsured: 10.6 },
  },
  {
    slug: "east-flatbush-flatbush",
    name: "East Flatbush / Flatbush",
    borough: "Brooklyn",
    population: 198000,
    metrics: { asthmaED: 72.8, obesity: 31.6, diabetes: 15.4, poverty: 24.6, pm25: 7.08, lifeExp: 80.4, smokers: 15.8, uninsured: 11.4 },
  },
  {
    slug: "canarsie-flatlands",
    name: "Canarsie / Flatlands",
    borough: "Brooklyn",
    population: 171000,
    metrics: { asthmaED: 58.4, obesity: 29.8, diabetes: 14.2, poverty: 16.8, pm25: 6.82, lifeExp: 81.8, smokers: 14.6, uninsured: 9.8 },
  },
  {
    slug: "bensonhurst-bay-ridge",
    name: "Bensonhurst / Bay Ridge",
    borough: "Brooklyn",
    population: 189000,
    metrics: { asthmaED: 38.6, obesity: 22.4, diabetes: 10.8, poverty: 16.2, pm25: 6.82, lifeExp: 84.1, smokers: 11.4, uninsured: 9.2 },
  },
  {
    slug: "coney-island-sheepshead-bay",
    name: "Coney Island / Sheepshead Bay",
    borough: "Brooklyn",
    population: 193000,
    metrics: { asthmaED: 44.8, obesity: 26.8, diabetes: 12.6, poverty: 22.4, pm25: 6.62, lifeExp: 82.6, smokers: 14.2, uninsured: 11.6 },
  },
  {
    slug: "greenpoint",
    name: "Greenpoint",
    borough: "Brooklyn",
    population: 169000,
    metrics: { asthmaED: 34.2, obesity: 20.8, diabetes: 8.4, poverty: 14.8, pm25: 7.36, lifeExp: 84.8, smokers: 12.4, uninsured: 8.4 },
  },
  {
    slug: "downtown-heights-slope",
    name: "Downtown / Heights / Slope",
    borough: "Brooklyn",
    population: 207000,
    metrics: { asthmaED: 28.6, obesity: 16.4, diabetes: 6.8, poverty: 12.4, pm25: 7.16, lifeExp: 86.2, smokers: 9.4, uninsured: 5.8 },
  },

  // ─── Manhattan ──────────────────────────────────────────────────────────────
  {
    slug: "east-harlem",
    name: "East Harlem",
    borough: "Manhattan",
    population: 118000,
    metrics: { asthmaED: 126.4, obesity: 32.8, diabetes: 16.2, poverty: 36.4, pm25: 6.90, lifeExp: 77.2, smokers: 20.4, uninsured: 15.2 },
  },
  {
    slug: "central-harlem-morningside-heights",
    name: "Central Harlem / Morningside Hts",
    borough: "Manhattan",
    population: 159000,
    metrics: { asthmaED: 84.6, obesity: 26.4, diabetes: 12.8, poverty: 28.6, pm25: 6.92, lifeExp: 80.4, smokers: 17.2, uninsured: 12.6 },
  },
  {
    slug: "washington-heights-inwood",
    name: "Washington Heights / Inwood",
    borough: "Manhattan",
    population: 213000,
    metrics: { asthmaED: 62.8, obesity: 28.4, diabetes: 13.4, poverty: 26.2, pm25: 6.98, lifeExp: 82.4, smokers: 14.6, uninsured: 13.8 },
  },
  {
    slug: "upper-west-side",
    name: "Upper West Side",
    borough: "Manhattan",
    population: 197000,
    metrics: { asthmaED: 22.4, obesity: 14.2, diabetes: 5.8, poverty: 10.4, pm25: 6.87, lifeExp: 88.2, smokers: 8.4, uninsured: 4.6 },
  },
  {
    slug: "upper-east-side",
    name: "Upper East Side",
    borough: "Manhattan",
    population: 213000,
    metrics: { asthmaED: 18.6, obesity: 12.4, diabetes: 4.8, poverty: 9.8, pm25: 6.98, lifeExp: 89.4, smokers: 7.2, uninsured: 3.8 },
  },
  {
    slug: "chelsea-village",
    name: "Chelsea / Village",
    borough: "Manhattan",
    population: 192000,
    metrics: { asthmaED: 24.8, obesity: 14.8, diabetes: 5.6, poverty: 12.8, pm25: 7.90, lifeExp: 87.8, smokers: 9.8, uninsured: 5.2 },
  },
  {
    slug: "union-square-lower-east-side",
    name: "Union Square / Lower East Side",
    borough: "Manhattan",
    population: 162000,
    metrics: { asthmaED: 32.4, obesity: 16.8, diabetes: 7.4, poverty: 18.4, pm25: 7.49, lifeExp: 86.4, smokers: 11.2, uninsured: 7.6 },
  },
  {
    slug: "lower-manhattan",
    name: "Lower Manhattan",
    borough: "Manhattan",
    population: 98000,
    metrics: { asthmaED: 19.2, obesity: 12.8, diabetes: 4.4, poverty: 10.2, pm25: 7.34, lifeExp: 88.6, smokers: 7.8, uninsured: 4.2 },
  },

  // ─── Queens ─────────────────────────────────────────────────────────────────
  {
    slug: "long-island-city-astoria",
    name: "Long Island City / Astoria",
    borough: "Queens",
    population: 198000,
    metrics: { asthmaED: 41.2, obesity: 21.4, diabetes: 9.8, poverty: 16.4, pm25: 7.25, lifeExp: 83.8, smokers: 12.8, uninsured: 10.2 },
  },
  {
    slug: "west-queens",
    name: "West Queens",
    borough: "Queens",
    population: 253000,
    metrics: { asthmaED: 48.6, obesity: 24.2, diabetes: 11.4, poverty: 18.8, pm25: 7.07, lifeExp: 83.2, smokers: 13.4, uninsured: 11.6 },
  },
  {
    slug: "flushing-clearview",
    name: "Flushing / Clearview",
    borough: "Queens",
    population: 248000,
    metrics: { asthmaED: 32.8, obesity: 18.4, diabetes: 10.2, poverty: 14.2, pm25: 6.84, lifeExp: 86.4, smokers: 10.2, uninsured: 10.8 },
  },
  {
    slug: "bayside-little-neck",
    name: "Bayside / Little Neck",
    borough: "Queens",
    population: 138000,
    metrics: { asthmaED: 24.6, obesity: 20.2, diabetes: 9.8, poverty: 10.4, pm25: 6.62, lifeExp: 86.8, smokers: 9.6, uninsured: 7.4 },
  },
  {
    slug: "jamaica",
    name: "Jamaica",
    borough: "Queens",
    population: 214000,
    metrics: { asthmaED: 68.4, obesity: 30.4, diabetes: 14.6, poverty: 22.8, pm25: 6.78, lifeExp: 80.8, smokers: 16.2, uninsured: 12.4 },
  },
  {
    slug: "south-ozone-park-richmond-hill",
    name: "South Ozone Park / Richmond Hill",
    borough: "Queens",
    population: 178000,
    metrics: { asthmaED: 54.8, obesity: 26.8, diabetes: 13.4, poverty: 18.4, pm25: 6.72, lifeExp: 82.4, smokers: 13.6, uninsured: 13.2 },
  },
  {
    slug: "rockaway",
    name: "Rockaway",
    borough: "Queens",
    population: 124000,
    metrics: { asthmaED: 58.2, obesity: 28.6, diabetes: 13.2, poverty: 24.6, pm25: 6.48, lifeExp: 80.6, smokers: 15.8, uninsured: 12.8 },
  },
  {
    slug: "southeast-queens",
    name: "Southeast Queens",
    borough: "Queens",
    population: 236000,
    metrics: { asthmaED: 62.4, obesity: 31.2, diabetes: 15.2, poverty: 14.8, pm25: 6.52, lifeExp: 81.4, smokers: 14.8, uninsured: 9.6 },
  },

  // ─── Staten Island ──────────────────────────────────────────────────────────
  {
    slug: "port-richmond",
    name: "Port Richmond",
    borough: "Staten Island",
    population: 73000,
    metrics: { asthmaED: 34.6, obesity: 28.4, diabetes: 12.4, poverty: 20.4, pm25: 6.28, lifeExp: 79.8, smokers: 16.4, uninsured: 13.6 },
  },
  {
    slug: "stapleton-st-george",
    name: "Stapleton / St. George",
    borough: "Staten Island",
    population: 114000,
    metrics: { asthmaED: 28.4, obesity: 30.2, diabetes: 12.8, poverty: 18.2, pm25: 6.22, lifeExp: 80.4, smokers: 17.2, uninsured: 11.8 },
  },
  {
    slug: "willowbrook",
    name: "Willowbrook",
    borough: "Staten Island",
    population: 114000,
    metrics: { asthmaED: 22.6, obesity: 28.8, diabetes: 11.6, poverty: 12.4, pm25: 6.12, lifeExp: 82.8, smokers: 15.6, uninsured: 8.4 },
  },
  {
    slug: "south-beach-tottenville",
    name: "South Beach / Tottenville",
    borough: "Staten Island",
    population: 105000,
    metrics: { asthmaED: 18.4, obesity: 29.6, diabetes: 11.2, poverty: 10.8, pm25: 6.12, lifeExp: 83.6, smokers: 15.2, uninsured: 7.6 },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export const neighborhoodsByBorough = (borough: Neighborhood["borough"]) =>
  neighborhoods.filter(n => n.borough === borough);

export const getNeighborhood = (slug: string) =>
  neighborhoods.find(n => n.slug === slug);

// NYC citywide averages (for context on profile pages)
export const cityAvg = {
  asthmaED:  58.4,
  obesity:   27.1,
  diabetes:  12.8,
  poverty:   19.4,
  pm25:       6.66,
  lifeExp:   81.0,
};

export const BOROUGH_ORDER = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"] as const;

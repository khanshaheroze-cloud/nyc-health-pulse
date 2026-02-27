import { NextResponse } from "next/server";

// CDC PLACES 2023 — census tract level health outcomes for NYC
// Fetches obesity, diabetes, and asthma data for all ~2,231 NYC tracts
// Revalidates weekly (data releases annually)
export const revalidate = 604800;

const NYC_COUNTY_FIPS = ["36005", "36047", "36061", "36081", "36085"];
const MEASURES = ["OBESITY", "DIABETES", "CASTHMA", "BPHIGH", "CSMOKING"];
const BASE = "https://chronicdata.cdc.gov/resource/cwsq-ngmh.json";

export async function GET() {
  try {
    const whereClause = NYC_COUNTY_FIPS.map(f => `countyfips='${f}'`).join(" OR ");
    const measuresClause = MEASURES.map(m => `measureid='${m}'`).join(" OR ");
    const url = `${BASE}?$where=(${whereClause}) AND (${measuresClause})&$select=locationid,measureid,data_value&$limit=15000`;

    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) throw new Error(`CDC PLACES API ${res.status}`);

    const rows = await res.json() as { locationid: string; measureid: string; data_value: string }[];

    // Build lookup: { locationid: { OBESITY: 24.1, DIABETES: 11.2, ... } }
    const lookup: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      if (!lookup[row.locationid]) lookup[row.locationid] = {};
      lookup[row.locationid][row.measureid] = parseFloat(row.data_value);
    }

    return NextResponse.json(lookup);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

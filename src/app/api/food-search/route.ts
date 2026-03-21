import { NextRequest, NextResponse } from "next/server";

// Search NYC DOHMH restaurant inspections (43nn-pn8j)
// Revalidate hourly — inspection data updates frequently
export const revalidate = 3600;

const BASE = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";

const BORO_MAP: Record<string, string> = {
  manhattan: "MANHATTAN",
  bronx: "BRONX",
  brooklyn: "BROOKLYN",
  queens: "QUEENS",
  "staten island": "STATEN ISLAND",
  "staten_island": "STATEN ISLAND",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q       = searchParams.get("q")?.trim() ?? "";
  const borough = searchParams.get("borough")?.trim().toLowerCase() ?? "";
  const zip     = searchParams.get("zip")?.trim() ?? "";

  if (!q && !borough && !zip) {
    return NextResponse.json({ error: "Provide at least one search parameter (q, borough, or zip)" }, { status: 400 });
  }

  try {
    // Build SoQL WHERE clauses
    const clauses: string[] = [];
    if (q) {
      clauses.push(`upper(dba) LIKE '%${q.toUpperCase().replace(/'/g, "''").replace(/%/g, "\\%")}%'`);
    }
    if (borough && BORO_MAP[borough]) {
      clauses.push(`boro='${BORO_MAP[borough]}'`);
    }
    if (zip && /^\d{5}$/.test(zip)) {
      clauses.push(`zipcode='${zip}'`);
    }

    const where = clauses.join(" AND ");

    // Fetch recent inspections with grades, grouped by camis (restaurant ID)
    // We get a larger set and deduplicate client-side by camis to get latest grade
    const url = `${BASE}?$where=${encodeURIComponent(where)}&$select=camis,dba,boro,zipcode,cuisine_description,grade,grade_date,building,street,critical_flag,violation_description&$order=grade_date DESC&$limit=200`;

    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) throw new Error(`DOHMH API ${res.status}`);

    const rows = await res.json() as Array<{
      camis: string;
      dba: string;
      boro: string;
      zipcode: string;
      cuisine_description: string;
      grade?: string;
      grade_date?: string;
      building?: string;
      street?: string;
      critical_flag?: string;
      violation_description?: string;
    }>;

    // Group by camis — keep latest grade + count critical violations
    const map = new Map<string, {
      camis: string;
      name: string;
      borough: string;
      zip: string;
      cuisine: string;
      grade: string;
      gradeDate: string;
      address: string;
      criticalCount: number;
    }>();

    for (const r of rows) {
      const existing = map.get(r.camis);
      if (!existing) {
        map.set(r.camis, {
          camis: r.camis,
          name: r.dba ?? "Unknown",
          borough: r.boro ?? "",
          zip: r.zipcode ?? "",
          cuisine: r.cuisine_description ?? "",
          grade: r.grade ?? "N/A",
          gradeDate: r.grade_date ?? "",
          address: [r.building, r.street].filter(Boolean).join(" "),
          criticalCount: r.critical_flag === "Critical" ? 1 : 0,
        });
      } else {
        // Count additional critical violations for same restaurant
        if (r.critical_flag === "Critical") {
          existing.criticalCount++;
        }
        // Keep the most recent grade (rows are ordered by grade_date DESC)
        if (!existing.grade || existing.grade === "N/A") {
          if (r.grade && r.grade !== "N/A") {
            existing.grade = r.grade;
            existing.gradeDate = r.grade_date ?? existing.gradeDate;
          }
        }
      }
    }

    const results = Array.from(map.values()).slice(0, 20);

    return NextResponse.json({ results, total: map.size });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

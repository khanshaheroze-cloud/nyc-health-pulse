import { NextResponse } from "next/server";

export const revalidate = 3600;

interface BoroughRow {
  borough: string;
  cnt: string;
}

interface TotalRow {
  total: string;
}

export async function GET() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19);

  const month = now.getMonth(); // 0-indexed
  // Heat season: Oct 1 (month 9) – May 31 (month 4)
  const isHeatSeason = month >= 9 || month <= 4;

  const baseUrl = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";
  const whereClause = `complaint_type='HEAT/HOT WATER' AND created_date > '${sevenDaysAgo}'`;

  try {
    const [boroughRes, totalRes] = await Promise.all([
      fetch(
        `${baseUrl}?$select=borough,count(*) as cnt&$where=${encodeURIComponent(whereClause)}&$group=borough&$order=cnt DESC`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `${baseUrl}?$select=count(*) as total&$where=${encodeURIComponent(whereClause)}`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    if (!boroughRes.ok || !totalRes.ok) {
      return NextResponse.json(
        { total: 0, byBorough: [], isHeatSeason },
        { status: 200 }
      );
    }

    const boroughData = (await boroughRes.json()) as BoroughRow[];
    const totalData = (await totalRes.json()) as TotalRow[];

    const total = totalData[0] ? parseInt(totalData[0].total, 10) : 0;
    const byBorough = boroughData.map((row) => ({
      borough: row.borough,
      count: parseInt(row.cnt, 10),
    }));

    return NextResponse.json({ total, byBorough, isHeatSeason });
  } catch {
    return NextResponse.json(
      { total: 0, byBorough: [], isHeatSeason },
      { status: 200 }
    );
  }
}

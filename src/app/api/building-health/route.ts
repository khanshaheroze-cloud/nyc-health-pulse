import { NextRequest, NextResponse } from "next/server";

// HPD Housing Violations + Complaints lookup
// Revalidate every hour
export const revalidate = 3600;

const VIOLATIONS_URL = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";
// Public HPD complaints dataset (eabe-havv) — uwyv-629c requires auth
const COMPLAINTS_URL = "https://data.cityofnewyork.us/resource/eabe-havv.json";

const BOROUGH_MAP: Record<string, string> = {
  MANHATTAN: "1",
  BRONX: "2",
  BROOKLYN: "3",
  QUEENS: "4",
  "STATEN ISLAND": "5",
};

// Complaints dataset uses community_board where first digit = borough code
// e.g. "105" = Manhattan (1), "305" = Brooklyn (3)

// HPD complaint category codes → human-readable labels
const COMPLAINT_CATEGORY_MAP: Record<string, string> = {
  "1": "Pests (Mice/Rats/Roaches)",
  "2": "Plumbing",
  "3": "Paint/Plaster",
  "4": "Elevator",
  "5": "Safety (Fire Escape/Smoke Detector)",
  "6": "Door/Window",
  "6M": "Lead Paint",
  "9": "Heating",
  "09": "Heating",
  "58": "Harrassment/Conditions",
  "10": "Electric",
  "11": "Water Supply",
  "12": "Sewage",
  "14": "Appliance",
  "15": "Flooring",
  "18": "Outside Area",
  "20": "Garbage/Recycling",
  "27": "Mail",
  "29": "General/Other",
  "30": "Nonconst",
  "45": "Water Leak",
  "49": "Mold",
  "52": "Ventilation",
  "53": "General Construction",
  "54": "Noise",
  "55": "Non-Emergency",
  "56": "Maintenance",
  "59": "Structural",
  "63": "Gas",
  "65": "Illegal Conversion",
  "66": "Vacate Order",
  "67": "Harassment",
  "71": "Electric - Loss of Service",
  "72": "Apartment Condition",
  "73": "Emergency",
  "75": "Hot Water",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address")?.trim();
  const borough = searchParams.get("borough")?.trim().toUpperCase();
  const zip = searchParams.get("zip")?.trim();

  if (!address || address.length < 3) {
    return NextResponse.json(
      { error: "Address must be at least 3 characters" },
      { status: 400 }
    );
  }

  // Parse house number and street name from address
  const match = address.match(/^(\d+[-\d]*)\s+(.+)$/i);
  const houseNumber = match ? match[1] : "";
  const streetName = match ? match[2] : address;

  try {
    // Build violation query
    const vWhere: string[] = [
      `upper(streetname) LIKE upper('%${streetName.replace(/'/g, "''")}%')`,
    ];
    if (houseNumber) {
      vWhere.push(`housenumber='${houseNumber}'`);
    }
    if (borough && BOROUGH_MAP[borough]) {
      vWhere.push(`boroid='${BOROUGH_MAP[borough]}'`);
    }
    if (zip) {
      vWhere.push(`zip='${zip}'`);
    }

    const vSelect =
      "violationid,boroid,block,lot,streetname,housenumber,apartment,zip,currentstatus,currentstatusdate,violationstatus,class,novdescription,inspectiondate";

    const violationsUrl = `${VIOLATIONS_URL}?$where=${encodeURIComponent(
      vWhere.join(" AND ")
    )}&$select=${vSelect}&$order=inspectiondate DESC&$limit=200`;

    // Build complaints query (eabe-havv uses house_number, house_street, zip_code, community_board)
    const cWhere: string[] = [
      `upper(house_street) LIKE upper('%${streetName.replace(/'/g, "''")}%')`,
    ];
    if (houseNumber) {
      cWhere.push(`house_number='${houseNumber}'`);
    }
    if (borough && BOROUGH_MAP[borough]) {
      // community_board first digit = borough code (e.g. "105" = Manhattan)
      cWhere.push(`starts_with(community_board, '${BOROUGH_MAP[borough]}')`);
    }
    if (zip) {
      cWhere.push(`zip_code='${zip}'`);
    }

    const cSelect =
      "complaint_number,status,date_entered,house_number,house_street,zip_code,complaint_category,disposition_date,inspection_date";

    const complaintsUrl = `${COMPLAINTS_URL}?$where=${encodeURIComponent(
      cWhere.join(" AND ")
    )}&$select=${cSelect}&$order=date_entered DESC&$limit=100`;

    // Fetch both in parallel; complaints are non-blocking
    const [vRes, cRes] = await Promise.all([
      fetch(violationsUrl, { next: { revalidate } }),
      fetch(complaintsUrl, { next: { revalidate } }).catch(() => null),
    ]);

    if (!vRes.ok)
      throw new Error(`HPD Violations API ${vRes.status}: ${await vRes.text()}`);

    const violations = (await vRes.json()) as Record<string, string>[];

    // Parse complaints gracefully — if the API fails, we still return violations
    let complaints: Record<string, string>[] = [];
    if (cRes && cRes.ok) {
      complaints = (await cRes.json()) as Record<string, string>[];
    }

    // Build summary
    const open = violations.filter(
      (v) => v.currentstatus?.toUpperCase() === "VIOLATION OPEN"
    ).length;
    const classA = violations.filter((v) => v.class === "A").length;
    const classB = violations.filter((v) => v.class === "B").length;
    const classC = violations.filter((v) => v.class === "C").length;

    // Complaints in last year (dates are MM/DD/YYYY)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentComplaints = complaints.filter((c) => {
      const d = c.date_entered || c.disposition_date;
      if (!d) return false;
      // Parse MM/DD/YYYY
      const parts = d.split("/");
      if (parts.length === 3) {
        return new Date(+parts[2], +parts[0] - 1, +parts[1]) >= oneYearAgo;
      }
      return new Date(d) >= oneYearAgo;
    }).length;

    // Normalize complaint fields to match client expectations
    const normalizedComplaints = complaints.map((c) => {
      // Parse MM/DD/YYYY date format
      const parseDate = (d?: string) => {
        if (!d) return undefined;
        const p = d.split("/");
        if (p.length === 3) return `${p[2]}-${p[0].padStart(2, "0")}-${p[1].padStart(2, "0")}`;
        return d;
      };
      return {
        complaintid: c.complaint_number,
        status: c.status,
        statusdate: parseDate(c.date_entered),
        majorcategory: COMPLAINT_CATEGORY_MAP[c.complaint_category] || `Category ${c.complaint_category}`,
        minorcategory: c.inspection_date ? `Inspected ${c.inspection_date}` : undefined,
      };
    });

    return NextResponse.json({
      violations,
      complaints: normalizedComplaints,
      summary: {
        total: violations.length,
        open,
        classA,
        classB,
        classC,
        recentComplaints,
      },
    });
  } catch (e) {
    console.error("Building health API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

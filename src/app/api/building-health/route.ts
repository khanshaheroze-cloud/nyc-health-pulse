import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

/* ── Dataset URLs ─────────────────────────────────────────────────────── */
const HPD_VIOLATIONS  = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";
const HPD_COMPLAINTS  = "https://data.cityofnewyork.us/resource/eabe-havv.json";
const DOB_VIOLATIONS  = "https://data.cityofnewyork.us/resource/3h2n-5cm9.json";
const DOB_COMPLAINTS  = "https://data.cityofnewyork.us/resource/eabe-havv.json"; // DOB complaints
const ECB_VIOLATIONS  = "https://data.cityofnewyork.us/resource/6bgk-3dad.json";
const NYC_311         = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json";

// DOB Complaints (construction/safety) — separate dataset from HPD complaints
const DOB_COMPLAINTS_URL = "https://data.cityofnewyork.us/resource/eabe-havv.json";

const BOROUGH_MAP: Record<string, string> = {
  MANHATTAN: "1", BRONX: "2", BROOKLYN: "3", QUEENS: "4", "STATEN ISLAND": "5",
};

/* ── Street normalization ─────────────────────────────────────────────── */
function normalizeStreet(street: string): string {
  return street
    .toUpperCase()
    .replace(/\bSTREET\b/gi, "ST")
    .replace(/\bAVENUE\b/gi, "AVE")
    .replace(/\bBOULEVARD\b/gi, "BLVD")
    .replace(/\bDRIVE\b/gi, "DR")
    .replace(/\bPLACE\b/gi, "PL")
    .replace(/\bROAD\b/gi, "RD")
    .replace(/\bCOURT\b/gi, "CT")
    .replace(/\bLANE\b/gi, "LN")
    .replace(/\bTERRACE\b/gi, "TER")
    .replace(/[.,]/g, "")
    .trim();
}

/* ── HPD complaint category codes ─────────────────────────────────────── */
const HPD_CATEGORY_MAP: Record<string, string> = {
  "1": "Pests (Mice/Rats/Roaches)", "2": "Plumbing", "3": "Paint/Plaster",
  "4": "Elevator", "5": "Safety (Fire Escape/Smoke Detector)", "6": "Door/Window",
  "6M": "Lead Paint", "9": "Heating", "09": "Heating", "10": "Electric",
  "11": "Water Supply", "12": "Sewage", "14": "Appliance", "15": "Flooring",
  "18": "Outside Area", "20": "Garbage/Recycling", "27": "Mail",
  "29": "General/Other", "30": "Nonconst", "45": "Water Leak", "49": "Mold",
  "52": "Ventilation", "53": "General Construction", "54": "Noise",
  "55": "Non-Emergency", "56": "Maintenance", "58": "Harassment/Conditions",
  "59": "Structural", "63": "Gas", "65": "Illegal Conversion", "66": "Vacate Order",
  "67": "Harassment", "71": "Electric - Loss of Service", "72": "Apartment Condition",
  "73": "Emergency", "75": "Hot Water",
};

/* ── Helpers ───────────────────────────────────────────────────────────── */
function esc(s: string) { return s.replace(/'/g, "''"); }

function parseDate(d?: string): string | undefined {
  if (!d) return undefined;
  const p = d.split("/");
  if (p.length === 3) return `${p[2]}-${p[0].padStart(2, "0")}-${p[1].padStart(2, "0")}`;
  return d;
}

function safeFetch(url: string): Promise<Record<string, string>[] | null> {
  return fetch(url, { next: { revalidate } })
    .then(async (r) => r.ok ? r.json() : null)
    .catch(() => null);
}

/* ── Main handler ─────────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address")?.trim();
  const borough = searchParams.get("borough")?.trim().toUpperCase();
  const zip = searchParams.get("zip")?.trim();

  if (!address || address.length < 3) {
    return NextResponse.json({ error: "Address must be at least 3 characters" }, { status: 400 });
  }

  const match = address.match(/^(\d+[-\d]*)\s+(.+)$/i);
  const houseNumber = match ? match[1] : "";
  const rawStreet = match ? match[2] : address;
  const street = normalizeStreet(rawStreet);
  const streetEsc = esc(street);
  const boroCode = borough ? BOROUGH_MAP[borough] : undefined;

  try {
    /* ── 1. HPD Violations ────────────────────────────────────────────── */
    const vWhere = [
      `upper(streetname) LIKE '%${streetEsc}%'`,
      ...(houseNumber ? [`housenumber='${houseNumber}'`] : []),
      ...(boroCode ? [`boroid='${boroCode}'`] : []),
      ...(zip ? [`zip='${zip}'`] : []),
    ].join(" AND ");
    const vUrl = `${HPD_VIOLATIONS}?$where=${encodeURIComponent(vWhere)}&$select=violationid,boroid,block,lot,streetname,housenumber,apartment,zip,currentstatus,currentstatusdate,violationstatus,class,novdescription,inspectiondate&$order=inspectiondate DESC&$limit=200`;

    /* ── 2. HPD Complaints ────────────────────────────────────────────── */
    const hcWhere = [
      `upper(house_street) LIKE '%${streetEsc}%'`,
      ...(houseNumber ? [`house_number='${houseNumber}'`] : []),
      ...(boroCode ? [`starts_with(community_board, '${boroCode}')`] : []),
      ...(zip ? [`zip_code='${zip}'`] : []),
    ].join(" AND ");
    const hcUrl = `${HPD_COMPLAINTS}?$where=${encodeURIComponent(hcWhere)}&$select=complaint_number,status,date_entered,house_number,house_street,zip_code,complaint_category,disposition_date,inspection_date&$order=date_entered DESC&$limit=100`;

    /* ── 3. DOB Violations ────────────────────────────────────────────── */
    const dvWhere = [
      `upper(street) LIKE '%${streetEsc}%'`,
      ...(houseNumber ? [`house_number='${houseNumber}'`] : []),
    ].join(" AND ");
    const dvUrl = `${DOB_VIOLATIONS}?$where=${encodeURIComponent(dvWhere)}&$select=isn_dob_bis_viol,violation_type,violation_category,issue_date,violation_number,disposition_date,disposition_comments,ecb_penalty_status&$order=issue_date DESC&$limit=50`;

    /* ── 4. ECB/OATH Violations (fines) ───────────────────────────────── */
    const ecbWhere = [
      `upper(respondent_street) LIKE '%${streetEsc}%'`,
      ...(houseNumber ? [`respondent_house_number='${houseNumber}'`] : []),
    ].join(" AND ");
    const ecbUrl = `${ECB_VIOLATIONS}?$where=${encodeURIComponent(ecbWhere)}&$select=isn_dob_bis_extract,ecb_violation_number,ecb_violation_status,violation_type,issue_date,balance_due,amount_paid,severity,violation_description&$order=issue_date DESC&$limit=50`;

    /* ── 5. 311 Complaints ────────────────────────────────────────────── */
    const addrSearch = houseNumber ? `${houseNumber} ${street}` : street;
    const threeOneOneWhere = `upper(incident_address) LIKE '%${esc(addrSearch)}%'`;
    const threeOneOneUrl = `${NYC_311}?$where=${encodeURIComponent(threeOneOneWhere)}&$select=unique_key,created_date,complaint_type,descriptor,status,resolution_description,borough&$order=created_date DESC&$limit=25`;

    /* ── Fetch all 5 in parallel ──────────────────────────────────────── */
    const [vRaw, hcRaw, dvRaw, ecbRaw, threeOneOneRaw] = await Promise.all([
      safeFetch(vUrl),
      safeFetch(hcUrl),
      safeFetch(dvUrl),
      safeFetch(ecbUrl),
      safeFetch(threeOneOneUrl),
    ]);

    const violations = vRaw ?? [];
    const hpdComplaints = hcRaw ?? [];
    const dobViolations = dvRaw ?? [];
    const ecbViolations = ecbRaw ?? [];
    const threeOneOne = threeOneOneRaw ?? [];

    /* ── HPD Violations summary ───────────────────────────────────────── */
    const openViol = violations.filter((v) => v.currentstatus?.toUpperCase() === "VIOLATION OPEN").length;
    const classA = violations.filter((v) => v.class === "A").length;
    const classB = violations.filter((v) => v.class === "B").length;
    const classC = violations.filter((v) => v.class === "C").length;
    const openClassC = violations.filter((v) => v.class === "C" && v.currentstatus?.toUpperCase() === "VIOLATION OPEN").length;

    /* ── HPD Complaints — normalize ───────────────────────────────────── */
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentHpdComplaints = hpdComplaints.filter((c) => {
      const d = c.date_entered || c.disposition_date;
      if (!d) return false;
      const parts = d.split("/");
      if (parts.length === 3) return new Date(+parts[2], +parts[0] - 1, +parts[1]) >= oneYearAgo;
      return new Date(d) >= oneYearAgo;
    }).length;

    const openHpdComplaints = hpdComplaints.filter((c) => c.status?.toUpperCase() !== "CLOSE").length;

    const normalizedHpdComplaints = hpdComplaints.map((c) => ({
      complaintid: c.complaint_number,
      status: c.status,
      statusdate: parseDate(c.date_entered),
      majorcategory: HPD_CATEGORY_MAP[c.complaint_category] || `Category ${c.complaint_category}`,
      minorcategory: c.inspection_date ? `Inspected ${c.inspection_date}` : undefined,
    }));

    /* ── DOB Violations — normalize ───────────────────────────────────── */
    const normalizedDobViolations = dobViolations.map((d) => ({
      id: d.isn_dob_bis_viol || d.violation_number,
      type: d.violation_type,
      category: d.violation_category,
      date: d.issue_date,
      dispositionDate: d.disposition_date,
      dispositionComments: d.disposition_comments,
      ecbPenaltyStatus: d.ecb_penalty_status,
    }));

    /* ── ECB/OATH Violations — normalize ──────────────────────────────── */
    const totalPenaltyDue = ecbViolations.reduce((sum, e) => {
      const amt = parseFloat(e.balance_due);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    const totalAmountPaid = ecbViolations.reduce((sum, e) => {
      const amt = parseFloat(e.amount_paid);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const normalizedEcbViolations = ecbViolations.map((e) => ({
      id: e.ecb_violation_number || e.isn_dob_bis_extract,
      status: e.ecb_violation_status,
      type: e.violation_type,
      date: e.issue_date,
      penaltyDue: parseFloat(e.balance_due) || 0,
      amountPaid: parseFloat(e.amount_paid) || 0,
      severity: e.severity,
      description: e.violation_description,
    }));

    /* ── 311 Complaints — normalize ───────────────────────────────────── */
    const normalized311 = threeOneOne.map((t) => ({
      id: t.unique_key,
      date: t.created_date,
      type: t.complaint_type,
      descriptor: t.descriptor,
      status: t.status,
      resolution: t.resolution_description,
      borough: t.borough,
    }));

    /* ── Building Health Score ─────────────────────────────────────────── */
    let score = 100;
    score -= openClassC * 15;            // Open Class C = -15 each
    score -= (openViol - openClassC) * 3; // Other open violations = -3 each
    score -= openHpdComplaints * 2;       // Open HPD complaints = -2 each
    score -= normalizedDobViolations.length * 4; // DOB violations = -4 each
    score -= Math.min(totalPenaltyDue / 500, 20); // ECB fines, up to -20
    score -= Math.min(normalized311.length, 10);   // 311 complaints, up to -10
    score = Math.max(0, Math.min(100, Math.round(score)));

    const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "F";

    /* ── Address from first result ────────────────────────────────────── */
    const addrDisplay = violations.length > 0
      ? `${violations[0].housenumber ?? ""} ${violations[0].streetname ?? ""}${violations[0].zip ? `, ${violations[0].zip}` : ""}`.trim()
      : hpdComplaints.length > 0
      ? `${hpdComplaints[0].house_number ?? ""} ${hpdComplaints[0].house_street ?? ""}`.trim()
      : `${houseNumber} ${rawStreet}`;

    return NextResponse.json({
      address: addrDisplay,
      score,
      grade,
      violations,
      hpdComplaints: normalizedHpdComplaints,
      dobViolations: normalizedDobViolations,
      ecbViolations: normalizedEcbViolations,
      threeOneOne: normalized311,
      summary: {
        hpdViolations: violations.length,
        hpdOpen: openViol,
        classA,
        classB,
        classC,
        openClassC,
        hpdComplaints: hpdComplaints.length,
        openHpdComplaints,
        recentHpdComplaints,
        dobViolations: normalizedDobViolations.length,
        ecbViolations: normalizedEcbViolations.length,
        ecbPenaltyDue: Math.round(totalPenaltyDue * 100) / 100,
        ecbAmountPaid: Math.round(totalAmountPaid * 100) / 100,
        threeOneOne: normalized311.length,
      },
    });
  } catch (e) {
    console.error("Building health API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

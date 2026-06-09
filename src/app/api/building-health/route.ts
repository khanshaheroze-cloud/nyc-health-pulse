import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;
// Hard ceiling so a slow upstream can never hang the Vercel function;
// every Socrata fetch below is individually capped at SOURCE_TIMEOUT_MS.
export const maxDuration = 15;

const SOURCE_TIMEOUT_MS = 8000;

// Unauthenticated Socrata requests are aggressively throttled. Set
// NYC_OPEN_DATA_APP_TOKEN in env (free at data.cityofnewyork.us) to lift limits.
const APP_TOKEN = process.env.NYC_OPEN_DATA_APP_TOKEN;

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
// NYC datasets (HPD, DOB, ECB, 311) store streets in canonical full-word form
// with ordinals stripped: "5th Ave" is stored as "5 AVENUE", "E 21st St" as
// "EAST 21 STREET". Normalize user input to that form or nothing matches.
const STREET_TYPES: Record<string, string> = {
  ST: "STREET", AVE: "AVENUE", AV: "AVENUE", BLVD: "BOULEVARD", DR: "DRIVE",
  PL: "PLACE", RD: "ROAD", CT: "COURT", LN: "LANE", TER: "TERRACE",
  PKWY: "PARKWAY", PKY: "PARKWAY", HWY: "HIGHWAY", EXPY: "EXPRESSWAY",
  SQ: "SQUARE", CIR: "CIRCLE",
};
const DIRECTIONALS: Record<string, string> = { E: "EAST", W: "WEST", N: "NORTH", S: "SOUTH" };

function normalizeStreet(street: string): string {
  const tokens = street
    .toUpperCase()
    .replace(/[.,]/g, "")
    .replace(/\b(\d+)(?:ST|ND|RD|TH)\b/g, "$1")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return "";
  if (tokens.length > 1 && DIRECTIONALS[tokens[0]]) tokens[0] = DIRECTIONALS[tokens[0]];
  // Expand the trailing street type only — "ST MARKS PL" must not become "STREET MARKS PLACE"
  const last = tokens[tokens.length - 1];
  if (STREET_TYPES[last]) tokens[tokens.length - 1] = STREET_TYPES[last];
  return tokens.join(" ");
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

interface SourceResult {
  name: string;
  data: Record<string, string>[] | null;
  error: string | null;
}

async function timedFetch(name: string, url: string): Promise<SourceResult> {
  const start = Date.now();
  try {
    const r = await fetch(url, {
      next: { revalidate },
      headers: APP_TOKEN ? { "X-App-Token": APP_TOKEN } : undefined,
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (!r.ok) {
      console.log(`[building-health] ${name}: HTTP ${r.status} in ${ms}ms`);
      return { name, data: null, error: `${name}: upstream returned ${r.status}` };
    }
    const data = (await r.json()) as Record<string, string>[];
    console.log(`[building-health] ${name}: ${Array.isArray(data) ? data.length : 0} rows in ${ms}ms`);
    return { name, data: Array.isArray(data) ? data : [], error: null };
  } catch (e) {
    const ms = Date.now() - start;
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    console.log(`[building-health] ${name}: ${timedOut ? "TIMEOUT" : `error (${e instanceof Error ? e.message : e})`} after ${ms}ms`);
    return {
      name,
      data: null,
      error: timedOut ? `${name}: timed out after ${SOURCE_TIMEOUT_MS / 1000}s` : `${name}: fetch failed`,
    };
  }
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
    // NB: this dataset has no ecb_penalty_status column — selecting it 400s the whole query
    const dvUrl = `${DOB_VIOLATIONS}?$where=${encodeURIComponent(dvWhere)}&$select=isn_dob_bis_viol,violation_type,violation_category,issue_date,violation_number,disposition_date,disposition_comments&$order=issue_date DESC&$limit=50`;

    /* ── 4. ECB/OATH Violations (fines) ───────────────────────────────── */
    const ecbWhere = [
      `upper(respondent_street) LIKE '%${streetEsc}%'`,
      ...(houseNumber ? [`respondent_house_number='${houseNumber}'`] : []),
    ].join(" AND ");
    const ecbUrl = `${ECB_VIOLATIONS}?$where=${encodeURIComponent(ecbWhere)}&$select=isn_dob_bis_extract,ecb_violation_number,ecb_violation_status,violation_type,issue_date,balance_due,amount_paid,severity,violation_description&$order=issue_date DESC&$limit=50`;

    /* ── 5. 311 Complaints ────────────────────────────────────────────── */
    // The 311 dataset is 30M+ rows; an unbounded LIKE '%…%' is a full table
    // scan that can run for minutes. Bound it to the last 2 years so the
    // indexed created_date column prunes the scan.
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const sinceIso = twoYearsAgo.toISOString().slice(0, 10);
    // Anchored prefix match when we have a house number: ~0.3s vs ~11s for a
    // double-wildcard LIKE, and "350 5 AVENUE%" can't false-match "1350 5 AVENUE".
    const threeOneOneWhere = houseNumber
      ? `created_date > '${sinceIso}' AND upper(incident_address) LIKE '${esc(`${houseNumber} ${street}`)}%'`
      : `created_date > '${sinceIso}' AND upper(incident_address) LIKE '%${esc(street)}%'`;
    const threeOneOneUrl = `${NYC_311}?$where=${encodeURIComponent(threeOneOneWhere)}&$select=unique_key,created_date,complaint_type,descriptor,status,resolution_description,borough&$order=created_date DESC&$limit=25`;

    /* ── Fetch all 5 in parallel, each with its own 8s timeout ────────── */
    const settled = await Promise.allSettled([
      timedFetch("hpd-violations", vUrl),
      timedFetch("hpd-complaints", hcUrl),
      timedFetch("dob-violations", dvUrl),
      timedFetch("ecb-violations", ecbUrl),
      timedFetch("311", threeOneOneUrl),
    ]);
    const results: SourceResult[] = settled.map((s, i) =>
      s.status === "fulfilled"
        ? s.value
        : { name: ["hpd-violations", "hpd-complaints", "dob-violations", "ecb-violations", "311"][i], data: null, error: "internal error" },
    );
    const sourceErrors = results.filter((r) => r.error).map((r) => r.error as string);

    const violations = results[0].data ?? [];
    const hpdComplaints = results[1].data ?? [];
    const dobViolations = results[2].data ?? [];
    const ecbViolations = results[3].data ?? [];
    const threeOneOne = results[4].data ?? [];

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

    // Status values are "CLOSED"/"ACTIVE" (older rows used "CLOSE") — match the prefix
    const openHpdComplaints = hpdComplaints.filter((c) => !c.status?.toUpperCase().startsWith("CLOSE")).length;

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
    // Only ACTIVE DOB violations count — the dataset goes back to the 1980s
    const activeDobViolations = dobViolations.filter((d) => d.violation_category?.toUpperCase().includes("ACTIVE")).length;
    score -= activeDobViolations * 4; // Active DOB violations = -4 each
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
      sourceErrors,
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

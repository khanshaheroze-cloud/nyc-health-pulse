/**
 * Venue verification pipeline — the weekly operating workflow.
 *
 * Usage (Node 23+ runs .ts directly):
 *   node scripts/verify-venue.ts <CAMIS>
 *   node scripts/verify-venue.ts "tamashii"        (name search near LIC)
 *   node scripts/verify-venue.ts "tamashii" --lat 40.74 --lng -73.95
 *
 * Pulls the DOHMH record and appends a skeleton entry to
 * src/data/verified-venues.json (or prints the existing entry if the CAMIS
 * is already present). Then:
 *   1. Walk in. Photograph the menu. Note prices, hours, and the 2-4 most
 *      macro-friendly orders.
 *   2. Fill menuItems[] by hand: name, price, calories, protein, fat, carbs,
 *      isRecommended, orderHack. NEVER invent numbers — leave unknown fields
 *      null and the venue stays status:"estimated".
 *   3. Set verification: { status: "verified", verifiedAt: <today ISO>,
 *      verifiedBy: <initials>, sourceNotes: <what you checked> }.
 *   4. pnpm test:data validates the schema in CI.
 *
 * Freshness SLA: re-verify every 90 days. verifiedAt older than 120 days
 * auto-downgrades the UI badge to "needs re-check" (src/lib/verifiedVenues.ts).
 */
import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "src", "data", "verified-venues.json");
const API = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";
const APP_TOKEN = process.env.NYC_OPEN_DATA_APP_TOKEN;

interface DohmhRow {
  camis: string;
  dba: string;
  cuisine_description?: string;
  grade?: string;
  building?: string;
  street?: string;
  boro?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  inspection_date?: string;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");
}

async function fetchDohmh(query: string, lat?: string, lng?: string): Promise<DohmhRow | null> {
  const isCamis = /^\d{8}$/.test(query);
  let where: string;
  if (isCamis) {
    where = `camis='${query}'`;
  } else {
    const esc = query.toUpperCase().replace(/'/g, "''");
    where = `upper(dba) LIKE '%${esc}%'`;
    if (lat && lng) where += ` AND within_circle(location, ${lat}, ${lng}, 3000)`;
  }
  const url = `${API}?$where=${encodeURIComponent(where)}&$select=camis,dba,cuisine_description,grade,building,street,boro,zipcode,latitude,longitude,inspection_date&$order=inspection_date DESC&$limit=10`;
  const res = await fetch(url, { headers: APP_TOKEN ? { "X-App-Token": APP_TOKEN } : undefined });
  if (!res.ok) {
    console.error(`DOHMH request failed: ${res.status}`);
    return null;
  }
  const rows = (await res.json()) as DohmhRow[];
  if (rows.length === 0) return null;
  // Dedupe by camis, prefer the most recent inspection (already ordered)
  const seen = new Map<string, DohmhRow>();
  for (const r of rows) if (!seen.has(r.camis)) seen.set(r.camis, r);
  const candidates = [...seen.values()];
  if (candidates.length > 1) {
    console.log("Multiple matches — re-run with the CAMIS:");
    for (const c of candidates) {
      console.log(`  ${c.camis}  ${c.dba}  ${c.building} ${c.street} (${c.cuisine_description}, grade ${c.grade ?? "?"})`);
    }
    return null;
  }
  return candidates[0];
}

async function main() {
  const [query, ...rest] = process.argv.slice(2);
  if (!query) {
    console.error('Usage: node scripts/verify-venue.ts <CAMIS | "name"> [--lat 40.74 --lng -73.95]');
    process.exit(1);
  }
  const latIdx = rest.indexOf("--lat");
  const lngIdx = rest.indexOf("--lng");
  const lat = latIdx >= 0 ? rest[latIdx + 1] : "40.7448"; // default: LIC launch area
  const lng = lngIdx >= 0 ? rest[lngIdx + 1] : "-73.9536";

  const row = await fetchDohmh(query, lat, lng);
  if (!row) {
    console.error("No unambiguous DOHMH match.");
    process.exit(1);
  }

  const venues = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const existing = venues.find((v: { dohmhCamis: string }) => v.dohmhCamis === row.camis);
  if (existing) {
    console.log(`Already present (slug: ${existing.slug}, status: ${existing.verification.status}). Edit it in src/data/verified-venues.json.`);
    return;
  }

  const name = titleCase(row.dba);
  const skeleton = {
    id: `camis-${row.camis}`,
    name,
    slug: name.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    address: `${titleCase(row.building ?? "")} ${titleCase(row.street ?? "")}, ${row.zipcode ?? ""}`.trim(),
    lat: parseFloat(row.latitude ?? "0"),
    lng: parseFloat(row.longitude ?? "0"),
    neighborhood: "",
    venueType: row.cuisine_description ?? "",
    dohmhCamis: row.camis,
    dohmhDba: row.dba,
    dohmhGrade: row.grade ?? null,
    dohmhInspectedAt: row.inspection_date?.slice(0, 10) ?? null,
    priceBand: null,
    hours: [],
    verification: {
      status: "estimated",
      verifiedAt: null,
      verifiedBy: null,
      sourceNotes: `Skeleton from DOHMH ${new Date().toISOString().slice(0, 10)}; awaiting in-person verification`,
    },
    menuItems: [],
  };

  venues.push(skeleton);
  fs.writeFileSync(DATA_PATH, JSON.stringify(venues, null, 2) + "\n");
  console.log(`Appended skeleton for ${name} (camis ${row.camis}, slug ${skeleton.slug}).`);
  console.log("Next: walk in, fill menuItems[] + hours + priceBand, set verification.status='verified'.");
}

main();

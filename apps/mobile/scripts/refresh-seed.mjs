// Regenerate the offline seed from LIVE near-me responses (App v1 phase 1).
// The seed is a map of cell → meal → NearMeResponse, so offline mode renders
// EXACTLY what online mode renders (same shape, same honesty labels) — the
// loader picks the nearest cell; no client-side scoring exists anymore.
//
// Run from apps/mobile:  node scripts/refresh-seed.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = process.env.SEED_API_URL ?? "https://pulsenyc.app";

// Launch-area coverage: LIC + Astoria + Sunnyside + Manhattan core.
const CELLS = [
  { id: "lic-court-sq", label: "Court Square, LIC", lat: 40.7471, lng: -73.9445 },
  { id: "lic-davis", label: "Davis St, LIC", lat: 40.7444, lng: -73.9489 },
  { id: "lic-hunters-pt", label: "Hunters Point, LIC", lat: 40.7425, lng: -73.9536 },
  { id: "lic-jackson", label: "Jackson Ave, LIC", lat: 40.7446, lng: -73.9487 },
  { id: "astoria-30th", label: "Astoria (30th Ave)", lat: 40.7644, lng: -73.9235 },
  { id: "astoria-ditmars", label: "Astoria (Ditmars)", lat: 40.7752, lng: -73.9121 },
  { id: "sunnyside-qb", label: "Sunnyside (Queens Blvd)", lat: 40.7434, lng: -73.92 },
  { id: "sunnyside-46th", label: "Sunnyside (46th St)", lat: 40.7455, lng: -73.918 },
  { id: "times-sq", label: "Times Square", lat: 40.758, lng: -73.9855 },
  { id: "union-sq", label: "Union Square", lat: 40.7359, lng: -73.9911 },
  { id: "fidi", label: "Financial District", lat: 40.7075, lng: -74.0089 },
  { id: "columbus-circle", label: "Columbus Circle", lat: 40.768, lng: -73.9819 },
];

// "coffee" omitted to keep the bundle lean; Late Night maps to snack.
const MEALS = ["breakfast", "lunch", "snack", "dinner"];

const out = { generatedAt: new Date().toISOString(), source: BASE, cells: [] };

for (const cell of CELLS) {
  const meals = {};
  for (const meal of MEALS) {
    const url = `${BASE}/api/smart-menu/near-me?lat=${cell.lat}&lng=${cell.lng}&meal=${meal}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.restaurants)) throw new Error(`${url} → malformed response`);
    meals[meal] = { restaurants: data.restaurants, excluded: data.excluded ?? [] };
    console.log(`${cell.id} ${meal}: ${data.restaurants.length} restaurants, ${(data.excluded ?? []).length} excluded`);
  }
  out.cells.push({ ...cell, meals });
}

const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "nyc-restaurants-seed.json");
writeFileSync(dest, JSON.stringify(out));
console.log(`\nWrote ${dest} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);

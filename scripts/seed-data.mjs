// One-time generator for the initial LIC/Hunters Point verified-venue
// skeletons. Source: live DOHMH records (CAMIS, grade, address, coords).
// Menu data is intentionally null — it gets filled by in-person verification
// via scripts/verify-venue.ts. Safe to delete after seeding.
import fs from "node:fs";

const SEEDS = [
  { camis: "50117856", dba: "SAFIR MEDITERRANEAN", name: "Safir Mediterranean", cuisine: "Turkish", grade: "A", addr: "47-31 Vernon Boulevard", zip: "11101", lat: 40.744664837651, lng: -73.953441757894, inspected: "2024-11-21" },
  { camis: "50060321", dba: "TAMASHII BLUE RAMEN", name: "Tamashii Blue Ramen", cuisine: "Japanese", grade: "A", addr: "47-36 Vernon Boulevard", zip: "11101", lat: 40.744604470458, lng: -73.953485106844, inspected: "2025-01-17" },
  { camis: "50117656", dba: "SAMI'S KABAB HOUSE", name: "Sami's Kabab House", cuisine: "Middle Eastern", grade: "A", addr: "47-38 Vernon Boulevard", zip: "11101", lat: 40.744593492874, lng: -73.95348872342, inspected: "2024-11-18" },
  { camis: "50156700", dba: "MERCATO LIC", name: "Mercato LIC", cuisine: "Italian", grade: "A", addr: "47-46 Vernon Boulevard", zip: "11101", lat: 40.744541348252, lng: -73.953503195484, inspected: "2025-02-19" },
  { camis: "50096385", dba: "R40", name: "R40", cuisine: "Latin American", grade: "A", addr: "47-16 Vernon Boulevard", zip: "11101", lat: 40.744996917169, lng: -73.953351302312, inspected: "2023-04-08" },
  { camis: "41481377", dba: "MADERA", name: "Madera", cuisine: "Latin American", grade: "A", addr: "47-29 Vernon Boulevard", zip: "11101", lat: 40.744678559995, lng: -73.95343813938, inspected: "2026-02-21" },
  { camis: "50135356", dba: "4747LIC", name: "4747 LIC", cuisine: "New American", grade: "A", addr: "47-25 Vernon Boulevard", zip: "11101", lat: 40.744895365389, lng: -73.953362200389, inspected: "2023-05-18" },
  { camis: "50005287", dba: "BLEND ON THE WATER", name: "Blend on the Water", cuisine: "Latin American", grade: "A", addr: "45-40 Center Boulevard", zip: "11109", lat: 40.748368839038, lng: -73.9568100475, inspected: "2025-11-14" },
  { camis: "41672537", dba: "SWEETLEAF COFFEE ROASTERS", name: "Sweetleaf Coffee Roasters", cuisine: "Coffee/Tea", grade: "A", addr: "10-93 Jackson Avenue", zip: "11101", lat: 40.743129728216, lng: -73.951540995515, inspected: "2026-04-23" },
  { camis: "50005184", dba: "HIBINO LIC", name: "Hibino LIC", cuisine: "Japanese", grade: "A", addr: "10-70 Jackson Avenue", zip: "11101", lat: 40.742759460868, lng: -73.952198064384, inspected: "2025-11-06" },
  { camis: "50065915", dba: "LEVANTE", name: "Levante", cuisine: "Italian", grade: "A", addr: "26-21 Jackson Avenue", zip: "11101", lat: 40.74740417739, lng: -73.941587762695, inspected: "2024-06-12" },
];

const venues = SEEDS.map((s) => ({
  id: `camis-${s.camis}`,
  name: s.name,
  slug: s.name.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  address: `${s.addr}, Long Island City, NY ${s.zip}`,
  lat: s.lat,
  lng: s.lng,
  neighborhood: "Hunters Point / Long Island City",
  venueType: s.cuisine,
  dohmhCamis: s.camis,
  dohmhDba: s.dba,
  dohmhGrade: s.grade,
  dohmhInspectedAt: s.inspected,
  priceBand: null,
  hours: [],
  verification: {
    status: "estimated",
    verifiedAt: null,
    verifiedBy: null,
    sourceNotes: "Seeded from DOHMH record Jun 2026; awaiting in-person menu verification",
  },
  menuItems: [],
}));

fs.writeFileSync("src/data/verified-venues.json", JSON.stringify(venues, null, 2) + "\n");
console.log(`wrote ${venues.length} venue skeletons`);
console.log(venues.map((v) => v.slug).join(", "));

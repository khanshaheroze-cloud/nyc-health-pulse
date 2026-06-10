import stationsJson from "@/lib/data/subway-stations.json";

// Static MTA subway station list (392 stations, generated from the MTA
// stations dataset data.ny.gov/39hk-dx4f). Powers subway-stop-aware location
// input: "Vernon Blvd-Jackson Av" → station coordinates.

export interface SubwayStation {
  name: string;
  borough: string;
  routes: string;
  lat: number;
  lng: number;
}

const STATIONS = stationsJson as SubwayStation[];

function norm(s: string): string {
  return s.toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9\- ]/g, "").trim();
}

/** Substring match over station names; startsWith matches rank first. */
export function searchStations(query: string, limit = 3): SubwayStation[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const starts: SubwayStation[] = [];
  const contains: SubwayStation[] = [];
  for (const s of STATIONS) {
    const n = norm(s.name);
    if (n.startsWith(q)) starts.push(s);
    else if (n.includes(q)) contains.push(s);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

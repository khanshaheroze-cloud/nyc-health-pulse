import { NextResponse } from "next/server";

// revalidate removed — using force-dynamic below

const ENDPOINT =
  "https://data.cityofnewyork.us/resource/erm2-nwe9.json" +
  "?$order=created_date DESC&$limit=12" +
  "&$select=created_date,complaint_type,descriptor,borough,incident_address,community_board" +
  "&$where=created_date>'2025-01-01'";

const ICONS: Record<string, string> = {
  "Noise":              "🔊",
  "Noise -":            "🔊",
  "HEAT/HOT WATER":     "🔥",
  "Rodent":             "🐀",
  "PLUMBING":           "🔧",
  "PAINT/PLASTER":      "🏚️",
  "Water System":       "💧",
  "Blocked Driveway":   "🚗",
  "Illegal Parking":    "🅿️",
  "Street Light":       "💡",
  "Street Condition":   "🚧",
  "Traffic Signal":     "🚦",
  "Sanitation":         "🗑️",
  "Food Establishment": "🍽️",
  "General Construction":"🏗️",
  "Scaffold Safety":    "🏗️",
  "Homeless Person":    "🏠",
  "Drug Activity":      "⚠️",
  "Graffiti":           "🎨",
  "Animal":             "🐾",
  "Tree":               "🌳",
};

function getIcon(type: string): string {
  for (const [key, icon] of Object.entries(ICONS)) {
    if (type.toUpperCase().startsWith(key.toUpperCase())) return icon;
  }
  return "📋";
}

function shortenBorough(b: string): string {
  const map: Record<string, string> = {
    MANHATTAN: "Manhattan",
    BROOKLYN: "Brooklyn",
    BRONX: "Bronx",
    QUEENS: "Queens",
    "STATEN ISLAND": "Staten Island",
  };
  return map[b?.toUpperCase()] ?? b;
}

/** Seed data shown when 311 API is unavailable */
function seedItems() {
  const now = Date.now();
  return [
    { time: new Date(now - 3 * 60000).toISOString(), icon: "🐀", type: "Rodent", borough: "Brooklyn", address: "" },
    { time: new Date(now - 8 * 60000).toISOString(), icon: "🔊", type: "Noise: Construction", borough: "Manhattan", address: "" },
    { time: new Date(now - 15 * 60000).toISOString(), icon: "🔥", type: "HEAT/HOT WATER", borough: "Bronx", address: "" },
    { time: new Date(now - 22 * 60000).toISOString(), icon: "🏗️", type: "General Construction", borough: "Manhattan", address: "" },
    { time: new Date(now - 31 * 60000).toISOString(), icon: "🍽️", type: "Food Establishment", borough: "Queens", address: "" },
    { time: new Date(now - 38 * 60000).toISOString(), icon: "💧", type: "Water System", borough: "Brooklyn", address: "" },
    { time: new Date(now - 45 * 60000).toISOString(), icon: "🔊", type: "Noise: Loud Music", borough: "Queens", address: "" },
    { time: new Date(now - 52 * 60000).toISOString(), icon: "🐀", type: "Rodent", borough: "Manhattan", address: "" },
    { time: new Date(now - 60 * 60000).toISOString(), icon: "🌳", type: "Tree", borough: "Staten Island", address: "" },
    { time: new Date(now - 68 * 60000).toISOString(), icon: "🚧", type: "Street Condition", borough: "Bronx", address: "" },
  ];
}

export const dynamic = "force-dynamic"; // never cache this route on Vercel edge

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(ENDPOINT, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ items: seedItems(), live: false });

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("json")) {
      // API returned HTML error page instead of JSON
      return NextResponse.json({ items: seedItems(), live: false });
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ items: seedItems(), live: false });
    }

    const items = (data as Record<string, string>[]).map((r) => ({
      time: r.created_date,
      icon: getIcon(r.complaint_type ?? ""),
      type: (r.complaint_type ?? "Unknown").replace(/^Noise - /, "Noise: "),
      borough: shortenBorough(r.borough ?? ""),
      address: r.incident_address ?? "",
    }));

    return NextResponse.json({ items, live: true });
  } catch {
    return NextResponse.json({ items: seedItems(), live: false });
  }
}

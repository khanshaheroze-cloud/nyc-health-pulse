const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const NYC_BBOX = "-74.26,40.49,-73.7,40.92";
const NYC_PROXIMITY = "-73.98,40.75";

export interface GeocodeSuggestion {
  label: string;
  shortLabel: string;
  neighborhood?: string;
  borough?: string;
  lat: number;
  lng: number;
}

// Belt-and-braces: bbox + country bound the API call, and this filter drops
// anything that still resolves outside the five boroughs (e.g. "Orange, NJ")
const FIVE_BOROUGHS = new Set(["new york", "brooklyn", "queens", "bronx", "the bronx", "staten island", "manhattan"]);

function isFiveBoroughs(feature: any): boolean {
  const context: any[] = feature.context ?? [];
  const region = context.find((c) => c.id?.startsWith("region"))?.text?.toLowerCase();
  if (region && region !== "new york") return false;
  const place = context.find((c) => c.id?.startsWith("place"))?.text?.toLowerCase();
  const district = context.find((c) => c.id?.startsWith("district"))?.text?.toLowerCase();
  if (place && FIVE_BOROUGHS.has(place)) return true;
  if (district && FIVE_BOROUGHS.has(district.replace(" county", ""))) return true;
  // place-type features (e.g. "Brooklyn" itself) have no place context
  if (feature.place_type?.[0] === "place" && FIVE_BOROUGHS.has(feature.text?.toLowerCase())) return true;
  return !place && !district; // addresses inside the bbox with sparse context pass through
}

export async function forwardGeocode(query: string): Promise<GeocodeSuggestion[]> {
  if (!MAPBOX_TOKEN || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${NYC_PROXIMITY}&bbox=${NYC_BBOX}&country=US&types=address,poi,neighborhood,place&limit=5&access_token=${MAPBOX_TOKEN}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).filter(isFiveBoroughs).map((f: any) => {
      const context = f.context ?? [];
      const neighborhood = context.find((c: any) => c.id?.startsWith("neighborhood"))?.text;
      const place = context.find((c: any) => c.id?.startsWith("place"))?.text;
      const borough = place ?? neighborhood;
      const shortLabel = f.text + (f.address ? ` ${f.address}` : "");
      return {
        label: f.place_name,
        shortLabel: f.place_name.replace(/, United States$/, "").replace(/, New York$/, ""),
        neighborhood,
        borough,
        lat: f.center[1],
        lng: f.center[0],
      };
    });
  } catch {
    return [];
  }
}

export interface ReverseGeocodeResult {
  label: string;
  neighborhood?: string;
  borough?: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,neighborhood,place&limit=1&access_token=${MAPBOX_TOKEN}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const context = feature.context ?? [];
    const neighborhood = context.find((c: any) => c.id?.startsWith("neighborhood"))?.text;
    const place = context.find((c: any) => c.id?.startsWith("place"))?.text;

    let label: string;
    if (feature.place_type?.[0] === "address") {
      const addr = feature.text + (feature.address ? ` ${feature.address}` : "");
      label = neighborhood ? `${addr}, ${neighborhood}` : addr;
    } else if (feature.place_type?.[0] === "neighborhood") {
      label = place ? `${feature.text}, ${place}` : feature.text;
    } else {
      label = feature.text;
    }

    return { label, neighborhood, borough: place };
  } catch {
    return null;
  }
}

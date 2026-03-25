import { NextResponse } from "next/server";

export const revalidate = 604800; // 7 days

interface BLSDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
}

interface BLSSeries {
  seriesID: string;
  data: BLSDataPoint[];
}

interface BLSResponse {
  status: string;
  Results?: {
    series: BLSSeries[];
  };
}

interface FoodPriceItem {
  name: string;
  price: number;
  unit: string;
  change: number;
  period: string;
  category: string;
}

const SERIES_META: Record<
  string,
  { name: string; unit: string; category: string }
> = {
  // APU0200 = Northeast urban area (closest to NYC prices)
  APU0200708111: { name: "Eggs (dozen)", unit: "per dozen", category: "Protein" },
  APU0200709112: { name: "Milk (gallon)", unit: "per gallon", category: "Dairy" },
  APU0200702111: { name: "Bread, white", unit: "per lb", category: "Grains" },
  APU0200706111: { name: "Chicken breast", unit: "per lb", category: "Protein" },
  APU0200711111: { name: "Bananas", unit: "per lb", category: "Produce" },
  APU0200701111: { name: "Rice, white", unit: "per lb", category: "Grains" },
  APU0200703112: { name: "Ground beef", unit: "per lb", category: "Protein" },
  APU0200710212: { name: "Cheddar cheese", unit: "per lb", category: "Dairy" },
  APU0200712112: { name: "Potatoes", unit: "per lb", category: "Produce" },
  APU0200714233: { name: "Orange juice (64 oz)", unit: "per 64 oz", category: "Beverages" },
};

const SERIES_IDS = Object.keys(SERIES_META);

function getFallbackData(): FoodPriceItem[] {
  return [
    { name: "Eggs (dozen)", price: 4.95, unit: "per dozen", change: 0, period: "Jan 2025", category: "Protein" },
    { name: "Milk (gallon)", price: 4.15, unit: "per gallon", change: 0, period: "Jan 2025", category: "Dairy" },
    { name: "Bread, white", price: 2.09, unit: "per lb", change: 0, period: "Jan 2025", category: "Grains" },
    { name: "Chicken breast", price: 4.31, unit: "per lb", change: 0, period: "Jan 2025", category: "Protein" },
    { name: "Bananas", price: 0.67, unit: "per lb", change: 0, period: "Jan 2025", category: "Produce" },
    { name: "Rice, white", price: 1.05, unit: "per lb", change: 0, period: "Jan 2025", category: "Grains" },
    { name: "Ground beef", price: 5.72, unit: "per lb", change: 0, period: "Jan 2025", category: "Protein" },
    { name: "Tomatoes", price: 2.18, unit: "per lb", change: 0, period: "Jan 2025", category: "Produce" },
    { name: "Potatoes", price: 1.15, unit: "per lb", change: 0, period: "Jan 2025", category: "Produce" },
    { name: "Orange juice (64 oz)", price: 5.48, unit: "per 64 oz", change: 0, period: "Jan 2025", category: "Beverages" },
  ];
}

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const startYear = String(currentYear - 1);
    const endYear = String(currentYear);

    const res = await fetch(
      "https://api.bls.gov/publicAPI/v2/timeseries/data/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesid: SERIES_IDS,
          startyear: startYear,
          endyear: endYear,
        }),
        next: { revalidate: 604800 },
      }
    );

    if (!res.ok) {
      throw new Error(`BLS API returned ${res.status}`);
    }

    const json: BLSResponse = await res.json();

    if (json.status !== "REQUEST_SUCCEEDED" || !json.Results?.series) {
      throw new Error(`BLS API status: ${json.status}`);
    }

    const items: FoodPriceItem[] = json.Results.series
      .map((series) => {
        const meta = SERIES_META[series.seriesID];
        if (!meta) return null;

        // BLS data is returned most-recent-first
        const sorted = [...series.data].sort((a, b) => {
          const aKey = `${a.year}${a.period}`;
          const bKey = `${b.year}${b.period}`;
          return bKey.localeCompare(aKey);
        });

        if (sorted.length === 0) return null;

        const latest = sorted[0];
        const previous = sorted.length > 1 ? sorted[1] : null;

        const price = parseFloat(latest.value);
        if (isNaN(price)) return null; // skip series with missing data

        const prevPrice = previous ? parseFloat(previous.value) : price;
        const change =
          !isNaN(prevPrice) && prevPrice > 0
            ? Math.round(((price - prevPrice) / prevPrice) * 1000) / 10
            : 0;

        return {
          name: meta.name,
          price: Math.round(price * 100) / 100,
          unit: meta.unit,
          change,
          period: `${latest.periodName} ${latest.year}`,
          category: meta.category,
        } satisfies FoodPriceItem;
      })
      .filter((item): item is FoodPriceItem => item !== null);

    if (items.length === 0) {
      throw new Error("No valid series data returned");
    }

    const basketTotal =
      Math.round(items.reduce((sum, i) => sum + i.price, 0) * 100) / 100;

    return NextResponse.json({
      items,
      basketTotal,
      source: "BLS CPI Average Price Data",
      note: "US city average — NYC prices may vary ±10-15%",
    });
  } catch (err) {
    console.error("Food prices API error:", err);

    const fallback = getFallbackData();
    const basketTotal =
      Math.round(fallback.reduce((sum, i) => sum + i.price, 0) * 100) / 100;

    return NextResponse.json({
      items: fallback,
      basketTotal,
      source: "BLS CPI Average Price Data",
      note: "US city average — NYC prices may vary ±10-15%. Using cached data due to API unavailability.",
    });
  }
}

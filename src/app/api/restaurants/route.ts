import { NextRequest, NextResponse } from "next/server";
import { CHAINS, DIET_FILTERS } from "@/lib/restaurantData";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category") ?? "";
  const diet = searchParams.get("diet") ?? "";
  const maxCal = Number(searchParams.get("maxCal")) || 0;
  const minProtein = Number(searchParams.get("minProtein")) || 0;
  const sortBy = searchParams.get("sort") ?? "name"; // name, cal, protein, locations

  let chains = [...CHAINS];

  // Filter by category
  if (category) {
    chains = chains.filter(c => c.category === category);
  }

  // Filter by search query (chain name or item name)
  if (q) {
    chains = chains.map(c => {
      const chainMatch = c.name.toLowerCase().includes(q);
      const matchingItems = c.items.filter(i => i.name.toLowerCase().includes(q));
      if (chainMatch) return c;
      if (matchingItems.length > 0) return { ...c, items: matchingItems };
      return null;
    }).filter(Boolean) as typeof chains;
  }

  // Apply diet/nutrition filters to items
  if (diet || maxCal || minProtein) {
    const dietFilter = diet ? DIET_FILTERS.find(d => d.id === diet)?.filter : null;
    chains = chains.map(c => {
      const filtered = c.items.filter(i => {
        if (dietFilter && !dietFilter(i)) return false;
        if (maxCal && i.cal > maxCal) return false;
        if (minProtein && i.protein < minProtein) return false;
        return true;
      });
      if (filtered.length === 0) return null;
      return { ...c, items: filtered };
    }).filter(Boolean) as typeof chains;
  }

  // Sort chains
  if (sortBy === "locations") {
    chains.sort((a, b) => b.nycLocations - a.nycLocations);
  } else if (sortBy === "items") {
    chains.sort((a, b) => b.items.length - a.items.length);
  }

  return NextResponse.json({
    chains,
    total: chains.length,
    totalItems: chains.reduce((s, c) => s + c.items.length, 0),
  });
}

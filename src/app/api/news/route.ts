import { NextResponse } from "next/server";

export const revalidate = 1800; // 30 minutes

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  pubDate: string;
  priority: boolean;
}

// Only flag as priority if it's a NYC-specific alert/outbreak — not generic CDC national news
const ALERT_TERMS = ["outbreak", "emergency", "advisory", "epidemic", "health alert", "warning"];
const NYC_TERMS   = ["new york", "nyc", "dohmh", "bronx", "brooklyn", "manhattan", "queens", "staten island"];

function isPriority(title: string, source: string): boolean {
  const combined = (title + " " + source).toLowerCase();
  const isAlert = ALERT_TERMS.some((t) => combined.includes(t));
  const isNYC   = NYC_TERMS.some((t) => combined.includes(t));
  return isAlert && isNYC;
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                       block.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "";
    if (!title) continue;

    const linkMatch = block.match(/<link>(https?:\/\/[^<]+)<\/link>/) ||
                      block.match(/<link\s*\/>[\s\S]*?<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/);
    const url = linkMatch ? linkMatch[1].trim() : "";
    if (!url) continue;

    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);
    const source = sourceMatch ? sourceMatch[1].trim() : "News";

    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const pubDate = dateMatch ? dateMatch[1].trim() : "";

    items.push({ title, url, source, pubDate, priority: isPriority(title, source) });
  }

  return items;
}

async function fetchRss(query: string): Promise<NewsItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NYCHealthPulse/1.0)" },
    next: { revalidate: 1800 },
  });

  if (!res.ok) return [];
  const xml = await res.text();
  return parseRssItems(xml);
}

export async function GET() {
  try {
    // Three NYC-focused queries — local outlets first, then agency, then alerts
    const [localItems, agencyItems, alertItems] = await Promise.all([
      // NYC local media health coverage: Gothamist, NY1, amNY, Crain's, City Limits, WNYC
      fetchRss('"New York City" health Gothamist OR NY1 OR amNY OR WNYC OR "City Limits" OR "Crain\'s"'),
      // Official NYC health agency news
      fetchRss('DOHMH OR "NYC Health" OR "New York City health department" hospital OR disease'),
      // NYC-specific health alerts and outbreaks
      fetchRss('"New York" outbreak OR "health alert" OR epidemic OR "public health" emergency 2026'),
    ]);

    // Local NYC outlets first, then agency, then alerts; deduplicate by URL
    const seen = new Set<string>();
    const merged: NewsItem[] = [];

    for (const item of [...localItems, ...agencyItems, ...alertItems]) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        merged.push(item);
      }
      if (merged.length >= 12) break;
    }

    return NextResponse.json({ items: merged, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ items: [], fetchedAt: new Date().toISOString() });
  }
}

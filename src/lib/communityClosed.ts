// Community "this place is closed" soft-exclusions (server only).
// Reads the existing data_reports review queue: two distinct 'closed' reports
// for a venue exclude it from ranked results immediately, pending review —
// the every-time-correct flywheel where APIs lag reality. Reports are never
// deleted here; the owner resolves them in the queue (status != 'new' rows
// stop counting, so a rejected report un-excludes the venue).

import { serviceClient } from "@/lib/supabase/service";
import { PLACES_CONFIG } from "@/lib/placesConfig";
import { normalizeForMatch } from "@/lib/places";

export interface CommunityClosedIndex {
  /** venue_id values (CAMIS or restaurantId) with >= threshold reports */
  ids: Set<string>;
  /** `${normalized name}|${normalized address}` keys with >= threshold reports */
  nameAddr: Set<string>;
}

const EMPTY: CommunityClosedIndex = { ids: new Set(), nameAddr: new Set() };

let cached: { index: CommunityClosedIndex; at: number } | null = null;
const MEMO_MS = 5 * 60 * 1000;

function nameAddrKey(name: string, address: string | null | undefined): string {
  return `${normalizeForMatch(name)}|${normalizeForMatch(address ?? "")}`;
}

export function isCommunityClosed(
  index: CommunityClosedIndex,
  venue: { camis?: string | null; restaurantId: string; name: string; address: string },
): boolean {
  if (venue.camis && index.ids.has(venue.camis)) return true;
  if (index.ids.has(venue.restaurantId)) return true;
  return index.nameAddr.has(nameAddrKey(venue.name, venue.address));
}

/** Fetch open 'closed' reports and index venues past the report threshold.
 *  Memoized 5 min per lambda; returns an empty index when Supabase is absent
 *  or errors — a broken queue must never take down results. */
export async function fetchCommunityClosed(): Promise<CommunityClosedIndex> {
  if (cached && Date.now() - cached.at < MEMO_MS) return cached.index;
  const sb = serviceClient();
  if (!sb) return EMPTY;
  try {
    const { data, error } = await sb
      .from("data_reports")
      .select("venue_id, venue_name, address")
      .eq("field", "closed")
      .eq("status", "new")
      .limit(1000);
    if (error || !data) return EMPTY;

    const byId = new Map<string, number>();
    const byNameAddr = new Map<string, number>();
    for (const r of data) {
      if (r.venue_id) byId.set(r.venue_id, (byId.get(r.venue_id) ?? 0) + 1);
      if (r.venue_name) {
        const key = nameAddrKey(r.venue_name, r.address);
        byNameAddr.set(key, (byNameAddr.get(key) ?? 0) + 1);
      }
    }
    const threshold = PLACES_CONFIG.COMMUNITY_CLOSED_REPORT_THRESHOLD;
    const index: CommunityClosedIndex = {
      ids: new Set([...byId.entries()].filter(([, n]) => n >= threshold).map(([k]) => k)),
      nameAddr: new Set([...byNameAddr.entries()].filter(([, n]) => n >= threshold).map(([k]) => k)),
    };
    cached = { index, at: Date.now() };
    return index;
  } catch {
    return EMPTY;
  }
}

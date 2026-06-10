import { getVenueBySlug, badgeState, type VerifiedVenue, type VerifiedMenuItem } from "@/lib/verifiedVenues";
import { matchGenericCategory } from "@/lib/genericRestaurants";

// Neighborhood food guides — the content/distribution surface. Each guide is
// built FROM the verified-venue data: when a venue's menu gets verified in
// person, its guide entry upgrades automatically from an "est." template
// suggestion to the real verified order with real prices.

export interface GuideSpot {
  venueSlug: string;
  /** Nearest subway stop ("Vernon Blvd-Jackson Av") */
  subwayStop: string;
  subwayRoutes: string;
  /** One-line editorial note: why this spot makes the list */
  why: string;
}

export interface Guide {
  slug: string;
  title: string;
  neighborhood: string;
  priceAnchor: string;
  intro: string;
  spots: GuideSpot[];
  publishedAt: string;
  updatedAt: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "healthy-lunch-under-15-long-island-city",
    title: "The 7 actually-healthy lunches under $15 in Long Island City",
    neighborhood: "Long Island City / Hunters Point",
    priceAnchor: "Under $15",
    intro:
      "The Vernon Boulevard corridor has quietly become one of the best macro-friendly lunch strips in Queens — Mediterranean, kabab, ramen, and more, all DOHMH Grade A, all a short walk from Vernon Blvd–Jackson Av on the 7. Here's exactly what to order at each, ranked.",
    publishedAt: "2026-06-10",
    updatedAt: "2026-06-10",
    spots: [
      {
        venueSlug: "safir-mediterranean",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Turkish grill where the gyro salad does what a $22 sweetgreen bowl wishes it could.",
      },
      {
        venueSlug: "samis-kabab-house",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Afghan kababs are one of the highest protein-per-dollar plays in the city.",
      },
      {
        venueSlug: "tamashii-blue-ramen",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Skip the tonkotsu; the grilled proteins and lighter bowls are the find.",
      },
      {
        venueSlug: "madera",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Latin grill plates — rice-and-protein done right, DOHMH Grade A.",
      },
      {
        venueSlug: "mercato-lic",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Italian market lunch — the salads and grilled panini side of the menu.",
      },
      {
        venueSlug: "hibino-lic",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Kyoto-style obanzai and sushi — lean fish, real portions.",
      },
      {
        venueSlug: "blend-on-the-water",
        subwayStop: "Vernon Blvd-Jackson Av",
        subwayRoutes: "7",
        why: "Waterfront Latin spot; order from the grilled section and take the view.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export interface ResolvedGuideSpot extends GuideSpot {
  venue: VerifiedVenue;
  /** The order to get: verified item when available, template estimate otherwise */
  order: { name: string; price: number | null; calories: number | null; protein: number | null; verified: boolean; orderHack?: string | null } | null;
  badge: ReturnType<typeof badgeState>;
}

/** Resolve a guide's spots against the live verified-venue data */
export function resolveGuideSpots(guide: Guide): ResolvedGuideSpot[] {
  const out: ResolvedGuideSpot[] = [];
  for (const spot of guide.spots) {
    const venue = getVenueBySlug(spot.venueSlug);
    if (!venue) continue;

    let order: ResolvedGuideSpot["order"] = null;
    const verifiedPick = venue.menuItems.find((m: VerifiedMenuItem) => m.isRecommended) ?? venue.menuItems[0];
    if (venue.verification.status === "verified" && verifiedPick) {
      order = {
        name: verifiedPick.name,
        price: verifiedPick.price,
        calories: verifiedPick.calories,
        protein: verifiedPick.protein,
        verified: true,
        orderHack: verifiedPick.orderHack,
      };
    } else {
      // Template estimate until the in-person verification lands (always
      // labeled "est." in the UI — never presented as verified)
      const template = matchGenericCategory(venue.venueType);
      const pick = template?.picks.find((p) => p.protein >= 20 && (p.estimatedPrice == null || p.estimatedPrice <= 15)) ?? template?.picks[0];
      if (pick) {
        order = {
          name: pick.name,
          price: pick.estimatedPrice ?? null,
          calories: pick.cal,
          protein: pick.protein,
          verified: false,
        };
      }
    }

    out.push({ ...spot, venue, order, badge: badgeState(venue.verification) });
  }
  return out;
}

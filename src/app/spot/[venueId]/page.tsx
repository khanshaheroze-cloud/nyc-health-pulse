import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { normalizeVenueName, canonicalBrand } from "@/lib/venue-normalize";
import { CHAINS } from "@/lib/restaurantData";
import { matchGenericCategory, templateByCuisineKey } from "@/lib/genericRestaurants";
import { classificationOverride } from "@/lib/venueClassification";
import { getVenueByCamis } from "@/lib/verifiedVenues";
import { latestGradedInspection } from "@/lib/inspection";

// Shareable per-venue page for REAL DOHMH venues, keyed by CAMIS (not template
// id). ISR on-demand: nothing is prebuilt, but each requested CAMIS is cached.
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return [] as { venueId: string }[];
}

type Props = { params: Promise<{ venueId: string }> };

const DOHMH = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";

interface DohmhVenue {
  camis: string;
  dba: string;
  cuisine: string;
  grade: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  inspectedAt: string | null;
  /** venue has inspections but none graded yet */
  notYetGraded: boolean;
}

async function fetchVenue(camis: string): Promise<DohmhVenue | null> {
  if (!/^\d{5,9}$/.test(camis)) return null;
  // One row per inspection: fetch recent rows and pick the most recent GRADED
  // one (July 5 audit: limit=1 could land on an ungraded/older cycle row).
  const params = new URLSearchParams({
    "$where": `camis='${camis}'`,
    "$select": "camis,dba,cuisine_description,grade,building,street,boro,latitude,longitude,inspection_date",
    "$order": "inspection_date DESC",
    "$limit": "25",
  });
  const token = process.env.NYC_OPEN_DATA_APP_TOKEN;
  try {
    const res = await fetch(`${DOHMH}?${params}`, {
      headers: token ? { "X-App-Token": token } : undefined,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, string>[];
    const r = rows[0];
    if (!r) return null;
    const latest = latestGradedInspection(rows);
    return {
      camis: r.camis,
      dba: r.dba || "",
      cuisine: r.cuisine_description || "",
      grade: latest.grade,
      address: [r.building, r.street, r.boro].filter(Boolean).join(" "),
      lat: r.latitude ? parseFloat(r.latitude) : null,
      lng: r.longitude ? parseFloat(r.longitude) : null,
      inspectedAt: latest.inspectedAt,
      notYetGraded: latest.notYetGraded,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueId } = await params;
  const v = await fetchVenue(venueId);
  if (!v) return { title: "Venue not found" };
  const name = normalizeVenueName(v.dba);
  const title = `${name} — Healthy Orders, Grade & Directions`;
  const description = `What to order healthy at ${name}${v.address ? ` (${v.address})` : ""}: PulseNYC's recommended macro-friendly picks, DOHMH grade${v.grade ? ` ${v.grade}` : ""}, and directions.`;
  return {
    title,
    description,
    alternates: { canonical: `/spot/${venueId}` },
    openGraph: { title, description, url: `/spot/${venueId}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SpotPage({ params }: Props) {
  const { venueId } = await params;
  const v = await fetchVenue(venueId);
  if (!v) notFound();

  const name = normalizeVenueName(v.dba);
  // "Verified menu & prices" may link ONLY to a page that exists and is
  // actually verified (July 5 audit: R40 — an estimated venue — linked to
  // /restaurants/r40, a 404, under a "✓ Verified" claim). /restaurants/[slug]
  // serves chains and status=verified venues with menu items; nothing else.
  const curated = getVenueByCamis(v.camis);
  const menuVerified = curated && curated.verification.status === "verified" && curated.menuItems.length > 0
    ? curated
    : null;
  // Chain venues link to the brand's real nutrition page instead.
  const brand = canonicalBrand(v.dba);
  const chainSlug = brand && CHAINS.some((c) => c.slug === brand.slug) ? brand.slug : null;
  const override = classificationOverride(name || v.dba);
  const template = override ? templateByCuisineKey(override) : matchGenericCategory(v.cuisine);

  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const hasGeo = v.lat != null && v.lng != null;
  const staticMap =
    mapToken && hasGeo
      ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+2f8f4d(${v.lng},${v.lat})/${v.lng},${v.lat},15,0/640x280@2x?access_token=${mapToken}`
      : null;
  const directionsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + v.address)}`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    url: `https://pulsenyc.app/spot/${venueId}`,
    ...(v.address ? { address: { "@type": "PostalAddress", streetAddress: v.address, addressLocality: "New York", addressRegion: "NY" } } : {}),
    ...(hasGeo ? { geo: { "@type": "GeoCoordinates", latitude: v.lat, longitude: v.lng } } : {}),
    ...(v.cuisine ? { servesCuisine: v.cuisine } : {}),
    ...(template ? { priceRange: "$".repeat(template.priceRange) } : {}),
  };

  return (
    <div className="max-w-2xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <div className="flex items-center gap-2 mb-4 text-[11px] text-dim">
        <Link href="/" className="hover:text-text transition-colors">← Find food</Link>
        <span className="text-muted">/</span>
        <span className="text-text font-semibold">{name}</span>
      </div>

      <h1 className="font-display text-[28px] sm:text-[34px] text-text leading-tight">{name}</h1>
      <p className="text-sm text-dim mt-1">
        {[
          v.cuisine,
          template?.category,
          v.grade
            ? `DOHMH Grade ${v.grade}${v.inspectedAt ? ` · Inspected ${new Date(v.inspectedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}`
            : v.notYetGraded
              ? "Not yet graded"
              : null,
        ].filter(Boolean).join(" · ")}
      </p>
      {v.address && <p className="text-[13px] text-dim mt-1">{v.address}</p>}

      <div className="flex flex-wrap gap-2 mt-3">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hp-green text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
          Get directions →
        </a>
        {menuVerified ? (
          <Link href={`/restaurants/${menuVerified.slug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[13px] font-semibold text-text hover:bg-surface transition-colors">
            ✓ Verified menu &amp; prices →
          </Link>
        ) : chainSlug ? (
          <Link href={`/restaurants/${chainSlug}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[13px] font-semibold text-text hover:bg-surface transition-colors">
            Full nutrition menu →
          </Link>
        ) : (
          <Link href="/methodology" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[13px] font-semibold text-dim hover:bg-surface transition-colors">
            How we estimate picks →
          </Link>
        )}
      </div>

      {staticMap && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={staticMap} alt={`Map showing ${name}`} width={640} height={280} className="w-full h-auto rounded-2xl border border-border mt-5" />
      )}

      {template ? (
        <section className="mt-8">
          <h2 className="font-display text-[20px] text-text mb-1">What to order healthy here</h2>
          <p className="text-[12px] text-muted mb-4">
            PulseNYC picks for a typical {template.category.toLowerCase()} · estimates, ±15% variance by location.
          </p>
          {template.orderingTip && (
            <div className="mb-4 p-3 bg-[#E8F0EA] rounded-xl text-[13px] text-[#4A7C59]">
              <strong>Pro tip:</strong> {template.orderingTip}
            </div>
          )}
          <div className="space-y-2">
            {template.picks.slice(0, 5).map((p) => (
              <div key={p.name} className="bg-surface border border-border rounded-xl p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-text">{p.name}</p>
                  {p.description && <p className="text-[12px] text-dim mt-0.5">{p.description}</p>}
                </div>
                <span className="text-[12px] text-dim whitespace-nowrap flex-shrink-0 tabular-nums">
                  ~{p.cal} cal · {p.protein}g P{p.estimatedPrice ? ` · ~$${p.estimatedPrice}` : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="font-display text-[20px] text-text mb-2">Ordering guidance</h2>
          <p className="text-[13px] text-dim">
            Ask for grilled over fried, sauce on the side, and add a vegetable side — that
            combination keeps calories in check at almost any kitchen.
          </p>
        </section>
      )}

      <p className="text-[11px] text-muted mt-8">
        Grade and location from NYC DOHMH restaurant inspections. Menu picks are PulseNYC
        recommendations, not this venue&apos;s official menu; macros are USDA-based estimates and
        vary ±15% by location and preparation.
      </p>
    </div>
  );
}

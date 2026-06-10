import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide, resolveGuideSpots } from "@/lib/guides";
import { formatMonthYear } from "@/lib/freshness";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const description = `${guide.spots.length} spots, exact orders, real prices and macros — ${guide.neighborhood}. ${guide.intro.slice(0, 120)}…`;
  return {
    title: guide.title,
    description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: { title: guide.title, description, url: `/guides/${slug}` },
    twitter: { card: "summary_large_image", title: guide.title, description },
  };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function staticMapUrl(spots: { venue: { lat: number; lng: number } }[]): string | null {
  if (!MAPBOX_TOKEN || spots.length === 0) return null;
  const pins = spots
    .map((s, i) => `pin-s-${i + 1}+2F8F4D(${s.venue.lng.toFixed(5)},${s.venue.lat.toFixed(5)})`)
    .join(",");
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pins}/auto/720x360@2x?access_token=${MAPBOX_TOKEN}`;
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const spots = resolveGuideSpots(guide);
  const mapUrl = staticMapUrl(spots);

  return (
    <article className="max-w-[720px] mx-auto py-10 px-4">
      <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-hp-green mb-2">
        {guide.neighborhood} · {guide.priceAnchor} · 🚇 {spots[0]?.subwayStop}
      </p>
      <h1 className="font-display text-[clamp(26px,5vw,38px)] text-text leading-tight mb-4">{guide.title}</h1>
      <p className="text-[15px] text-dim leading-relaxed mb-6">{guide.intro}</p>

      {mapUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mapUrl}
          alt={`Map of ${guide.spots.length} spots in ${guide.neighborhood}`}
          className="w-full rounded-2xl border border-border mb-8"
          width={720}
          height={360}
        />
      )}

      <ol className="space-y-5 mb-10">
        {spots.map((s, i) => (
          <li key={s.venueSlug} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-start gap-4">
              {/* Photo placeholder until we shoot them */}
              <div className="w-16 h-16 rounded-xl bg-hp-green/10 border border-hp-green/20 flex items-center justify-center text-[22px] font-display font-bold text-hp-green flex-shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-[19px] text-text leading-snug">{s.venue.name}</h2>
                  {s.badge === "verified" && (
                    <span className="text-[10px] font-bold text-hp-green bg-hp-green/10 border border-hp-green/25 px-1.5 py-0.5 rounded-full">
                      ✓ Verified {formatMonthYear(s.venue.verification.verifiedAt)}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-dim mt-0.5">
                  {s.venue.venueType} · {s.venue.address.split(",")[0]}
                  {s.venue.dohmhGrade ? ` · Grade ${s.venue.dohmhGrade}` : ""} · 🚇 {s.subwayStop} ({s.subwayRoutes})
                </p>
                <p className="text-[13px] text-dim leading-relaxed mt-2">{s.why}</p>
                {s.order && (
                  <div className="mt-3 bg-bg border border-border rounded-xl px-3.5 py-2.5">
                    <p className="text-[13px] text-text">
                      <strong>Order:</strong> {s.order.name}
                      {s.order.price != null && <span className="font-semibold"> — ~${s.order.price}</span>}
                      {!s.order.verified && <span className="text-[11px] text-muted ml-1">est.</span>}
                    </p>
                    <p className="text-[11px] text-dim mt-0.5">
                      {s.order.calories != null ? `~${s.order.calories} cal` : ""}
                      {s.order.protein != null ? ` · ${s.order.protein}g protein` : ""}
                      {s.order.orderHack ? ` · 💡 ${s.order.orderHack}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mb-10">
        <NewsletterSignup source={`guide-${guide.slug}`} />
      </div>

      <p className="text-[11px] text-muted border-t border-border pt-4">
        Orders marked &ldquo;est.&rdquo; use cuisine-typical estimates (±15%) until we verify the menu in
        person — ✓-badged spots are checked on foot, re-verified every 90 days.{" "}
        <Link href="/methodology" className="text-hp-green hover:underline">How PulseScore works</Link>.
        Updated {guide.updatedAt}.
      </p>
    </article>
  );
}

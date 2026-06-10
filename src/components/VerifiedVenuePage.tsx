import Link from "next/link";
import { formatMonthYear } from "@/lib/freshness";
import { badgeState, type VerifiedVenue } from "@/lib/verifiedVenues";
import { TrackView } from "@/components/TrackView";

// Detail page for an in-person-verified independent venue — the data-moat
// surface. Real menu, real prices, real macros, freshness visible.

function fmt(n: number | null | undefined, suffix = ""): string {
  return n == null ? "—" : `${n}${suffix}`;
}

export function VerifiedVenuePage({ venue }: { venue: VerifiedVenue }) {
  const badge = badgeState(venue.verification);
  const verifiedLabel = formatMonthYear(venue.verification.verifiedAt);
  const recommended = venue.menuItems.filter((m) => m.isRecommended);
  const rest = venue.menuItems.filter((m) => !m.isRecommended);

  return (
    <div>
      <TrackView event="venue_detail_view" />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-[11px] text-dim">
        <Link href="/" className="hover:text-text transition-colors">← Find Food</Link>
        <span className="text-muted">/</span>
        <span>{venue.neighborhood}</span>
        <span className="text-muted">/</span>
        <span className="text-text font-semibold">{venue.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-[24px] leading-tight">{venue.name}</h1>
          <p className="text-[12px] text-dim mt-0.5">
            {venue.venueType} · {venue.address}
            {venue.dohmhGrade ? ` · DOHMH Grade ${venue.dohmhGrade}` : ""}
            {venue.priceBand ? ` · ${"$".repeat(venue.priceBand)}` : ""}
          </p>
        </div>
      </div>

      {/* Verification badge — the product story */}
      <div
        data-testid="verified-badge"
        className={`rounded-xl px-4 py-3 mb-5 border ${
          badge === "verified"
            ? "bg-hp-green/8 border-hp-green/25"
            : badge === "needs-recheck"
              ? "bg-hp-yellow/10 border-hp-yellow/25"
              : "bg-surface border-border"
        }`}
      >
        <p className="text-[13px] font-bold text-text">
          {badge === "verified" && <>✓ Menu verified {verifiedLabel}</>}
          {badge === "needs-recheck" && <>⟳ Verified {verifiedLabel} — needs re-check</>}
          {badge === "estimated" && <>Estimates — not yet verified in person</>}
        </p>
        <p className="text-[11px] text-dim mt-0.5">
          Verified by PulseNYC — we check menus, prices, and hours in person.
          {venue.verification.sourceNotes ? ` ${venue.verification.sourceNotes}.` : ""}
        </p>
      </div>

      {/* Hours */}
      {venue.hours.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-5">
          <h2 className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-2">Hours</h2>
          <ul className="text-[12px] text-dim space-y-0.5">
            {venue.hours.map((h, i) => (
              <li key={i}>
                <span className="text-text font-medium">{h.days}</span> {h.open}–{h.close}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended orders */}
      {recommended.length > 0 && (
        <>
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted mb-3">What to order</h2>
          <div className="space-y-3 mb-6">
            {recommended.map((m, i) => (
              <div key={i} data-testid="verified-menu-item" className="bg-surface border border-hp-green/25 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-text">
                      <span className="text-hp-green mr-1">★</span>
                      {m.name}
                    </p>
                    {m.orderHack && <p className="text-[12px] text-dim mt-1">💡 {m.orderHack}</p>}
                  </div>
                  <span className="text-[16px] font-display font-bold text-text whitespace-nowrap flex-shrink-0">
                    {m.price != null ? `$${m.price}` : "—"}
                  </span>
                </div>
                <p className="text-[12px] text-dim mt-2">
                  {fmt(m.calories, " cal")} · {fmt(m.protein, "g protein")} · {fmt(m.carbs, "g carbs")} · {fmt(m.fat, "g fat")}
                  {m.sodium != null ? ` · ${m.sodium}mg sodium` : ""}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rest of the verified menu */}
      {rest.length > 0 && (
        <>
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted mb-3">Also on the menu</h2>
          <div className="space-y-2 mb-6">
            {rest.map((m, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text">{m.name}</p>
                  <p className="text-[11px] text-dim">
                    {fmt(m.calories, " cal")} · {fmt(m.protein, "g protein")}
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-text whitespace-nowrap">{m.price != null ? `$${m.price}` : "—"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-muted border-t border-border pt-4">
        Re-verified every 90 days. Spotted a change?{" "}
        <Link href="/methodology" className="text-hp-green hover:underline">How PulseScore works</Link>
        {" · "}DOHMH inspection {venue.dohmhInspectedAt ? formatMonthYear(venue.dohmhInspectedAt) : "—"}
      </p>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How PulseScore Works — Methodology",
  description:
    "The exact scoring model behind PulseNYC's healthy-pick rankings: protein efficiency, fiber density, calorie reasonableness, sodium and sugar penalties, plus how DOHMH inspection grades and curated chain data feed in.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "How PulseScore Works — Methodology",
    description:
      "The exact scoring model behind PulseNYC's healthy-pick rankings — every weight, penalty, and data source.",
    url: "/methodology",
  },
  twitter: {
    card: "summary_large_image",
    title: "How PulseScore Works — Methodology",
    description:
      "The exact scoring model behind PulseNYC's healthy-pick rankings — every weight, penalty, and data source.",
  },
};

const COMPONENTS = [
  {
    name: "Protein efficiency",
    points: "0–55",
    detail:
      "Calories per gram of protein. ≤7 cal/g earns the full 55 points; the score steps down through 10, 14, 18, 25, and 35 cal/g. This is the dominant factor: food that feeds you without overshooting your day wins.",
  },
  {
    name: "Absolute protein",
    points: "0–15",
    detail: "≥40g earns 15, ≥30g earns 12, ≥20g earns 6, ≥10g earns 3 — so a tiny-but-efficient item can't outrank a real meal.",
  },
  {
    name: "Fiber density",
    points: "0–18",
    detail: "Fiber per 100 calories: ≥2.5% earns 18, stepping down through 1.5%, 0.8%, and 0.4%.",
  },
  {
    name: "Calorie reasonableness",
    points: "0–15",
    detail: "≤300 cal earns 15, ≤450 earns 12, ≤600 earns 8, ≤800 earns 4. Above 800 earns nothing.",
  },
  {
    name: "Sodium penalty",
    points: "0 to −6",
    detail: ">1,800mg costs 6 points, >1,500mg costs 3, >1,200mg costs 1.",
  },
  {
    name: "Sugar penalty",
    points: "0 to −6",
    detail: ">20g costs 6 points, >12g costs 3, >6g costs 1.",
  },
];

export default function MethodologyPage() {
  return (
    <article className="max-w-[720px] mx-auto py-10 px-4">
      <h1 className="font-display text-[clamp(26px,5vw,36px)] text-text leading-tight mb-3">
        How PulseScore works
      </h1>
      <p className="text-[15px] text-dim leading-relaxed mb-8">
        Every recommended order on PulseNYC carries a 0–100 PulseScore. It is a fixed, public formula —
        no editorial thumb on the scale, no paid placement. Here is the entire model.
      </p>

      <h2 className="font-display text-[20px] text-text mb-3">The score, component by component</h2>
      <div className="space-y-3 mb-8">
        {COMPONENTS.map((c) => (
          <div key={c.name} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <h3 className="text-[14px] font-bold text-text">{c.name}</h3>
              <span className="text-[12px] font-semibold text-hp-green whitespace-nowrap">{c.points} pts</span>
            </div>
            <p className="text-[13px] text-dim leading-relaxed">{c.detail}</p>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-dim leading-relaxed mb-4">
        The components sum and clamp to 0–100. When you filter by meal (breakfast, lunch, dinner), items
        matching that meal get a 10-point ranking bonus, and the headline &ldquo;best order&rdquo; must be a real
        meal — at least 200 calories and not a beverage. The best drink, if any, is shown separately so a
        5-calorie cold brew can never claim a restaurant&apos;s top pick.
      </p>
      <p className="text-[13px] text-dim leading-relaxed mb-8">
        <strong className="text-text">The under-$15 anchor.</strong> The default venue ranking adds the
        price wedge on top of PulseScore: orders estimated at $15 or less (or venues in the $/$$ band when
        the exact order price is unknown) get +8 ranking points, and $$$ venues get −8. Sorting by
        Protein, Calories, Distance, or Protein per $ bypasses the anchor. Every card shows the estimated
        order price — an exact &ldquo;~$11&rdquo; when we know it, a &ldquo;~$10–15&rdquo; band when we don&apos;t. Price is
        never hidden.
      </p>

      <h2 className="font-display text-[20px] text-text mb-3">Where the data comes from</h2>
      <ul className="space-y-2 text-[13px] text-dim leading-relaxed mb-8 list-disc pl-5">
        <li>
          <strong className="text-text">Venues:</strong> NYC DOHMH restaurant inspection data, refreshed hourly.
          Only venues currently graded A or B appear in ranked picks. Bars, lounges, nightlife, dessert-only
          shops, and hotel banquet kitchens are excluded from rankings (they stay visible on the map).
        </li>
        <li>
          <strong className="text-text">Chain nutrition:</strong> curated from each chain&apos;s published
          nutrition data for 30+ NYC chains, validated in CI against sanity bounds (a 50-calorie
          &ldquo;meal&rdquo; fails the build).
        </li>
        <li>
          <strong className="text-text">Local venues:</strong> when a restaurant isn&apos;t a known chain, picks
          come from a cuisine template matched to its DOHMH cuisine code and are labeled
          &ldquo;est.&rdquo; — expect ±15% variance from the real menu. If no template fits the cuisine, we show
          ordering guidance instead of inventing a dish.
        </li>
      </ul>

      <h2 className="font-display text-[20px] text-text mb-3">Corrections</h2>
      <p className="text-[13px] text-dim leading-relaxed mb-8">
        Every venue panel has a &ldquo;Report an error&rdquo; form. Reports land in a review queue with the venue,
        field, and your note; data fixes ship in the next deploy.
      </p>

      <p className="text-[11px] text-muted leading-relaxed border-t border-border pt-4">
        PulseScore ranks relative nutritional value — it is not medical advice and doesn&apos;t know your
        dietary needs. Nutrition values for non-chain venues are estimates (±15%).
      </p>
    </article>
  );
}

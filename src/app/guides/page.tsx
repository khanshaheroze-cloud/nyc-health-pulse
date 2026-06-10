import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const TITLE = "NYC Neighborhood Food Guides — Healthy, Under $15, Verified";
const DESCRIPTION =
  "Ranked neighborhood guides to actually-healthy meals under $15 — exact orders, real prices and macros, nearest subway stop. Starting in Long Island City.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function GuidesPage() {
  return (
    <div className="max-w-[720px] mx-auto py-10 px-4">
      <h1 className="font-display text-[clamp(26px,5vw,36px)] text-text leading-tight mb-3">
        Neighborhood food guides
      </h1>
      <p className="text-[15px] text-dim leading-relaxed mb-8">
        One neighborhood at a time: the actually-healthy meals under $15, with exactly what to order,
        what it costs, and the macros. Built from menus we check in person.
      </p>

      <div className="space-y-4 mb-10">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="block bg-surface border border-border rounded-2xl p-5 hover:border-hp-green/40 hover:-translate-y-0.5 transition-all"
          >
            <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-hp-green mb-1">
              {g.neighborhood} · {g.priceAnchor}
            </p>
            <h2 className="font-display text-[20px] text-text leading-snug mb-1">{g.title}</h2>
            <p className="text-[13px] text-dim">{g.spots.length} spots · updated {g.updatedAt}</p>
          </Link>
        ))}
      </div>

      <NewsletterSignup source="guides-index" />
    </div>
  );
}

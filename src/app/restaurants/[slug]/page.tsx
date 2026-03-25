import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CHAINS } from "@/lib/restaurantData";
import { ChainMenu } from "@/components/ChainMenu";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return CHAINS.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chain = CHAINS.find(c => c.slug === slug);
  if (!chain) return {};
  return {
    title: `${chain.name} Nutrition Guide`,
    description: `Complete nutrition breakdown for ${chain.items.length} menu items at ${chain.name}. Calories, protein, fat, carbs, sodium for every item.`,
  };
}

export default async function ChainPage({ params }: Props) {
  const { slug } = await params;
  const chain = CHAINS.find(c => c.slug === slug);
  if (!chain) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-[11px] text-dim">
        <Link href="/restaurants" className="hover:text-text transition-colors">← All Restaurants</Link>
        <span className="text-muted">/</span>
        <span>{chain.category}</span>
        <span className="text-muted">/</span>
        <span className="text-text font-semibold">{chain.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-hp-green/10 flex items-center justify-center text-2xl flex-shrink-0">
          {chain.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-[22px] leading-tight">{chain.name}</h1>
          <p className="text-[12px] text-dim mt-0.5">
            {chain.items.length} menu items · {chain.nycLocations} NYC locations · {'$'.repeat(chain.priceRange)} · {chain.category}
          </p>
        </div>
      </div>

      {/* Ordering tip */}
      {chain.orderingTip && (
        <div className="bg-hp-green/5 border border-hp-green/15 rounded-xl p-3 mb-5 flex gap-2">
          <span className="text-base flex-shrink-0">💡</span>
          <p className="text-[12px] text-dim leading-relaxed"><span className="font-semibold text-text">Pro tip:</span> {chain.orderingTip}</p>
        </div>
      )}

      {/* Client-side interactive menu */}
      <ChainMenu chain={JSON.parse(JSON.stringify(chain))} />
    </div>
  );
}

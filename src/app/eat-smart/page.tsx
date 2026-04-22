import { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { EatSmartChainCard } from "@/components/EatSmartChainCard";
import { NutritionSearch } from "@/components/NutritionSearch";
import { EatSmartMapHero } from "@/components/eat-smart/EatSmartMapHero";
import { CHAINS, CHALLENGE_STATS } from "@/lib/eatSmartData";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eat Smart NYC — Best Low-Calorie Orders at 30 NYC Chains",
  description:
    "Find the healthiest menu items at Chipotle, Sweetgreen, McDonald's, CAVA, Taco Bell and 25+ NYC chains. Search 500K+ foods with USDA + Open Food Facts data.",
  openGraph: {
    title: "Eat Smart NYC — Best Low-Calorie Orders at 30 NYC Chains",
    description: "Standing in line? Find the best order under 600 calories at any NYC chain.",
  },
};

export default function EatSmartPage() {
  const totalChains = CHAINS.length;
  const totalItems = CHAINS.reduce((s, c) => s + c.items.length, 0);

  return (
    <SectionShell
      icon="🥗"
      title=""
      description=""
      accentColor="rgba(45,212,160,.12)"
    >
      {/* ── HERO: Map-first discovery ── */}
      <EatSmartMapHero />

      {/* ── Or browse by chain ── */}
      <div className="flex items-center gap-3 mt-10 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">
          Or browse by chain — {totalChains} NYC chains ranked by PulseScore
        </h2>
        <div className="flex-1 h-px bg-border-light" />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border-light rounded-2xl px-3 py-3 text-center card-hover animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-[18px] font-display font-bold text-hp-green">{totalChains}</p>
          <p className="text-[10px] text-dim">NYC Chains</p>
        </div>
        <div className="bg-surface border border-border-light rounded-2xl px-3 py-3 text-center card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-[18px] font-display font-bold text-hp-blue">{totalItems}</p>
          <p className="text-[10px] text-dim">Curated Picks</p>
        </div>
        <div className="bg-surface border border-border-light rounded-2xl px-3 py-3 text-center card-hover animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-[18px] font-display font-bold text-hp-orange">&lt;600</p>
          <p className="text-[10px] text-dim">Cal Target</p>
        </div>
      </div>

      {/* 600-Calorie Context */}
      <div className="bg-surface-peach border border-hp-orange/15 rounded-2xl px-5 py-4 mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <p className="text-[12px] font-bold text-text mb-1">
          🎯 The 600-Calorie Rule
        </p>
        <p className="text-[11px] text-dim leading-relaxed">
          NYC DOHMH recommends keeping meals under <strong className="text-text">600 cal</strong>.
          The avg fast food meal is <strong className="text-hp-red">{CHALLENGE_STATS.avgFastFoodMeal.toLocaleString()} cal</strong> —
          nearly half your daily needs. <strong className="text-text">{CHALLENGE_STATS.nycObesityRate}% of NYC adults are obese.</strong>
        </p>
      </div>

      {/* Quick Picks by Chain */}
      <p className="text-[11px] text-dim mb-4">
        Tap any chain to see the best orders under 600 calories, with protein counts and an ordering hack.
      </p>

      {(() => {
        const sorted = [...CHAINS].sort((a, b) => b.locations - a.locations);
        const featured = sorted.slice(0, 8);
        const rest = sorted.slice(8);
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {featured.map((chain, i) => (
                <div key={chain.slug} className="animate-fade-in-up" style={{ animationDelay: `${0.05 * i}s` }}>
                  <EatSmartChainCard chain={chain} featured />
                </div>
              ))}
            </div>

            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">More Chains</h3>
                  <div className="flex-1 h-px bg-border-light" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
                  {rest.map((chain, i) => (
                    <div key={chain.slug} className="animate-fade-in-up" style={{ animationDelay: `${0.03 * i}s` }}>
                      <EatSmartChainCard chain={chain} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        );
      })()}

      {/* ── How We Pick (expandable) ── */}
      <details className="bg-surface border border-border-light rounded-2xl mb-10 animate-fade-in-up group">
        <summary className="flex items-center gap-2 cursor-pointer px-5 py-3 text-[12px] font-bold text-text select-none">
          <span>📊</span> How We Pick the Best Orders
          <svg className="w-3 h-3 ml-auto text-dim transition-transform group-open:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5 L6 8 L9 5" /></svg>
        </summary>
        <div className="px-5 pb-4 text-[11px] text-dim leading-relaxed space-y-2 border-t border-border-light pt-3">
          <p><strong className="text-text">PulseScore</strong> rates every menu item (0–100) based on nutritional quality, not just calories:</p>
          <ul className="space-y-1 ml-3">
            <li><strong className="text-text">Protein efficiency (50%)</strong> — how much protein per calorie. The &quot;10:1 rule&quot;: 1g protein per 10 cal = excellent.</li>
            <li><strong className="text-text">Fiber &amp; nutrients (20%)</strong> — fiber density per calorie, a proxy for whole-food quality.</li>
            <li><strong className="text-text">Calorie budget (20%)</strong> — staying under the 600 cal/meal target.</li>
            <li><strong className="text-text">Sodium check (−10)</strong> — penalty for very high sodium (&gt;1000mg).</li>
          </ul>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green">💪 High Protein — ratio ≤ 10:1</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green">💪 Lean — ratio ≤ 15:1</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green">🌿 High Fiber — 5g+</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green">🎯 Smart Pick — under 300 cal + 15g protein</span>
          </div>
        </div>
      </details>

      {/* ── Search Any Food ── */}
      <div id="search" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">
            Search Any Food
          </h2>
          <div className="flex-1 h-px bg-border-light" />
        </div>
        <div className="bg-surface-peach border border-hp-orange/15 rounded-3xl p-7 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔍</span>
            <p className="text-[14px] font-bold text-text">Search Any Food</p>
          </div>
          <p className="text-[11px] text-dim mb-3">
            500K+ foods from USDA FoodData Central + Open Food Facts · Build a meal · See macro breakdown
          </p>
          <NutritionSearch />
        </div>
      </div>

      {/* ── 600-Calorie Challenge ── */}
      <div className="flex items-center gap-3 mt-4 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">
          The 600-Calorie Challenge
        </h2>
        <div className="flex-1 h-px bg-border-light" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-hp-red/5 border border-hp-red/20 rounded-3xl p-6 card-hover animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-[10px] font-bold text-hp-red uppercase tracking-widest mb-2">Typical fast food lunch</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]"><span className="text-dim">Double cheeseburger</span><span className="font-bold text-text">450 cal · 25g P</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-dim">Large fries</span><span className="font-bold text-text">490 cal · 7g P</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-dim">Medium soda</span><span className="font-bold text-text">210 cal · 0g P</span></div>
            <div className="flex justify-between text-[12px] pt-1.5 border-t border-hp-red/20"><span className="font-bold text-hp-red">Total</span><span className="font-bold text-hp-red">1,150 cal · 32g protein</span></div>
            <p className="text-[10px] text-hp-red/70 mt-0.5">Protein ratio: 36:1 (poor)</p>
          </div>
        </div>

        <div className="bg-hp-green/5 border border-hp-green/20 rounded-3xl p-6 card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-[10px] font-bold text-hp-green uppercase tracking-widest mb-2">Eat Smart alternative</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]"><span className="text-dim">Chipotle chicken bowl (no rice)</span><span className="font-bold text-text">415 cal · 46g P</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-dim">Water</span><span className="font-bold text-text">0 cal · 0g P</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-dim">Apple (from home)</span><span className="font-bold text-text">95 cal · 0g P</span></div>
            <div className="flex justify-between text-[12px] pt-1.5 border-t border-hp-green/20"><span className="font-bold text-hp-green">Total</span><span className="font-bold text-hp-green">510 cal · 46g protein</span></div>
            <p className="text-[10px] text-hp-green/70 mt-0.5">Protein ratio: 11:1 (excellent)</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-sage rounded-2xl px-5 py-3 mb-3 animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
        <p className="text-[12px] font-bold text-text text-center">
          1.4x the protein at half the calories. That&apos;s what smart ordering looks like.
        </p>
      </div>

      <div className="bg-surface border border-border-light rounded-3xl p-6 mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <p className="text-[13px] font-bold text-text mb-2">Small changes, big impact</p>
        <ul className="space-y-1.5 text-[11px] text-dim">
          <li>Switching from a 1,150-cal lunch to a 510-cal lunch <strong className="text-text">saves 640 calories per day</strong></li>
          <li>You get <strong className="text-text">44% more protein</strong> — better for muscle, satiety, and energy</li>
          <li>Over a work week, that&apos;s <strong className="text-text">3,200 fewer calories</strong> — more than a full day&apos;s worth</li>
          <li>Over a year (250 work days), that&apos;s <strong className="text-text">~46 pounds</strong> worth of calories saved</li>
          <li>You don&apos;t need to eat salads every day — just make one swap per meal</li>
        </ul>
      </div>

      {/* ── Related Pages ── */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Related</h2>
        <div className="flex-1 h-px bg-border-light" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Link href="/grocery" className="bg-surface border border-border-light rounded-2xl px-4 py-3.5 hover:border-hp-orange/30 hover:shadow-sm transition-all card-hover animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-[12px] font-bold text-text">Grocery Guide</p>
          <p className="text-[10px] text-dim">Healthy $35 weekly basket — cook at home and save ~300 cal/meal</p>
        </Link>
        <Link href="/food-safety" className="bg-surface border border-border-light rounded-2xl px-4 py-3.5 hover:border-hp-orange/30 hover:shadow-sm transition-all card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-[12px] font-bold text-text">Food Safety</p>
          <p className="text-[10px] text-dim">Check restaurant inspection grades before you eat out</p>
        </Link>
        <Link href="/nutrition" className="bg-surface border border-border-light rounded-2xl px-4 py-3.5 hover:border-hp-orange/30 hover:shadow-sm transition-all card-hover animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-[12px] font-bold text-text">Nutrition Data</p>
          <p className="text-[10px] text-dim">NYC obesity, food desert, and diet data at the population level</p>
        </Link>
      </div>

      <p className="text-[9px] text-muted text-center mt-6">
        Nutrition data from USDA FoodData Central, Open Food Facts, NYC DOHMH MenuStat, and chain-published nutrition guides.
        Values are approximate and may vary by location and preparation. Not medical advice.
      </p>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Link href="/food-safety" className="flex items-center gap-3 flex-1 min-w-[240px] px-5 py-4 rounded-2xl bg-surface border border-border-light hover:border-hp-orange/30 hover:shadow-sm transition-all group card-hover animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <span className="text-lg">🍽️</span>
          <div>
            <p className="text-[12px] font-semibold text-text group-hover:text-hp-orange transition-colors">Check restaurant grades first</p>
            <p className="text-[10px] text-muted">Look up inspection scores before you go</p>
          </div>
        </Link>
        <Link href="/grocery" className="flex items-center gap-3 flex-1 min-w-[240px] px-5 py-4 rounded-2xl bg-surface border border-border-light hover:border-hp-orange/30 hover:shadow-sm transition-all group card-hover animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <span className="text-lg">🛒</span>
          <div>
            <p className="text-[12px] font-semibold text-text group-hover:text-hp-orange transition-colors">Grocery prices this week</p>
            <p className="text-[10px] text-muted">10-item basket tracker with BLS price data</p>
          </div>
        </Link>
      </div>
    </SectionShell>
  );
}

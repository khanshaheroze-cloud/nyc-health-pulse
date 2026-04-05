import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Restaurant Safety — Inspection Grades & Violations",
  description: "Check NYC restaurant inspection grades and critical violations by borough and cuisine. Updated hourly from NYC DOHMH inspection data.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { FoodSafetySearch } from "@/components/FoodSafetySearch";
import { KPICard } from "@/components/KPICard";
import { ViolationsByCuisineChart, ScoreByBoroughChart, GradeDistributionChart } from "@/components/FoodSafetyCharts";
import { fetchFoodByCuisine, fetchFoodByBorough, fetchGradeDistribution } from "@/lib/liveData";
import { ScrollReveal } from "@/components/ScrollReveal";
import Link from "next/link";
import { foodByCuisine, foodByBorough, gradeDistribution } from "@/lib/data";

export default async function FoodSafetyPage() {
  const [byCuisine, byBorough, grades] = await Promise.all([
    fetchFoodByCuisine(),
    fetchFoodByBorough(),
    fetchGradeDistribution(),
  ]);

  const foodTag    = grades ? "LIVE" : "2024";
  // Derive KPI values from grade distribution (live or static fallback)
  const gradeData  = grades   ?? gradeDistribution;
  const gradeA     = gradeData.find(g => g.name === "Grade A")?.value;
  const gradeTotal = gradeData.reduce((s, g) => s + g.value, 0);
  const gradePct   = gradeA && gradeTotal ? `${Math.round((gradeA / gradeTotal) * 100)}%` : "49%";

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Restaurant Inspection Results — Grades & Violations by Borough and Cuisine",
      description: "Restaurant health inspection scores, letter grades, and critical violation counts across NYC boroughs and cuisine types. Updated hourly from NYC DOHMH.",
      pagePath: "/food-safety",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2010-01-01/..",
      distribution: [
        { name: "NYC DOHMH Restaurant Inspections", contentUrl: "https://data.cityofnewyork.us/resource/43nn-pn8j.json" },
      ],
      variableMeasured: ["Inspection Score", "Letter Grade (A/B/C)", "Critical Violations Count", "Violations by Cuisine Type"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🍽️"
      title="Food Safety"
      description="Restaurant inspection results, critical violations, and grade distributions · NYC DOHMH · Live"
      accentColor="rgba(167,139,250,.12)"
    >
      {/* ── Prominent Restaurant Search ── */}
      <div className="mb-8">
        <FoodSafetySearch />
      </div>

      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Grade A"         value={gradeA?.toLocaleString("en-US") ?? "311"} sub={`${gradePct} of graded`} color="green" tag={foodTag} />
        <KPICard label="Pending (N)"     value={gradeData.find(g=>g.name==="Pending N")?.value.toLocaleString("en-US") ?? "235"} sub="awaiting re-inspection" color="yellow" tag={foodTag} />
        <KPICard label="Pending (Z)"     value={gradeData.find(g=>g.name==="Pending Z")?.value.toLocaleString("en-US") ?? "88"} sub="grade under appeal" color="orange" tag={foodTag} />
        <KPICard label="Worst Avg Score" value={String(Math.max(...(byBorough ?? foodByBorough).map(b => b.avgScore)))} sub={(byBorough ?? foodByBorough).reduce((a, b) => a.avgScore > b.avgScore ? a : b).borough} color="red" tag={byBorough ? "LIVE" : "2024"} />
      </div>
      </ScrollReveal>

      {/* Stats & Charts */}
      <ScrollReveal delay={100}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <ViolationsByCuisineChart data={byCuisine ?? undefined} />
        <GradeDistributionChart   data={grades    ?? undefined} />
      </div>
      </ScrollReveal>

      <ScrollReveal delay={150}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <ScoreByBoroughChart data={byBorough ?? undefined} />
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted mb-3 pb-2 border-b border-border-light">Scoring Guide</h3>
          <p className="text-[12px] text-dim leading-relaxed">
            NYC scores are penalty-based — <strong className="text-text">lower is better</strong>.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
            <div className="text-center px-2 py-2 rounded-xl bg-hp-green/8 border border-hp-green/15">
              <p className="text-[18px] font-display font-bold text-hp-green">A</p>
              <p className="text-[10px] text-dim">0–13 pts</p>
            </div>
            <div className="text-center px-2 py-2 rounded-xl bg-hp-orange/8 border border-hp-orange/15">
              <p className="text-[18px] font-display font-bold text-hp-orange">B</p>
              <p className="text-[10px] text-dim">14–27 pts</p>
            </div>
            <div className="text-center px-2 py-2 rounded-xl bg-hp-red/8 border border-hp-red/15">
              <p className="text-[18px] font-display font-bold text-hp-red">C</p>
              <p className="text-[10px] text-dim">28+ pts</p>
            </div>
          </div>
          <p className="text-[11px] text-dim leading-relaxed">
            <strong className="text-text">N</strong> = not yet graded (initial inspection).
            <strong className="text-text"> Z</strong> = grade pending appeal.
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">Live — updates hourly from NYC DOHMH</p>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Link href="/eat-smart" className="flex items-center gap-3 flex-1 min-w-[240px] px-5 py-4 rounded-2xl bg-surface border border-border-light hover:border-hp-green/30 hover:shadow-sm transition-all group">
          <span className="text-lg">🥗</span>
          <div>
            <p className="text-[13px] font-semibold text-text group-hover:text-hp-green transition-colors">Healthy options at this chain</p>
            <p className="text-[11px] text-muted">Low-calorie orders at 30+ NYC chains</p>
          </div>
        </Link>
        <Link href="/building-health" className="flex items-center gap-3 flex-1 min-w-[240px] px-5 py-4 rounded-2xl bg-surface border border-border-light hover:border-hp-green/30 hover:shadow-sm transition-all group">
          <span className="text-lg">🏢</span>
          <div>
            <p className="text-[13px] font-semibold text-text group-hover:text-hp-green transition-colors">Check the building too</p>
            <p className="text-[11px] text-muted">HPD violations, DOB records, and ECB fines</p>
          </div>
        </Link>
      </div>
    </SectionShell>
    </>
  );
}

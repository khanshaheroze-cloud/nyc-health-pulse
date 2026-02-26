import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { ViolationsByCuisineChart, ScoreByBoroughChart, GradeDistributionChart } from "@/components/FoodSafetyCharts";
import { fetchFoodByCuisine, fetchFoodByBorough, fetchGradeDistribution } from "@/lib/liveData";
import { foodByCuisine, foodByBorough, gradeDistribution } from "@/lib/data";

export default async function FoodSafetyPage() {
  const [byCuisine, byBorough, grades] = await Promise.all([
    fetchFoodByCuisine(),
    fetchFoodByBorough(),
    fetchGradeDistribution(),
  ]);

  // Derive live KPI values from grade distribution if available
  const gradeData  = grades   ?? gradeDistribution;
  const gradeA     = gradeData.find(g => g.name === "Grade A")?.value;
  const gradeTotal = gradeData.reduce((s, g) => s + g.value, 0);
  const gradePct   = gradeA && gradeTotal ? `${Math.round((gradeA / gradeTotal) * 100)}%` : "49%";

  return (
    <SectionShell
      icon="🍽️"
      title="Food Safety"
      description="Restaurant inspection results, critical violations, and grade distributions · NYC DOHMH · Live"
      accentColor="rgba(167,139,250,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Grade A"         value={gradeA?.toLocaleString() ?? "311"} sub={`${gradePct} of graded`} color="green" />
        <KPICard label="Pending (N)"     value={gradeData.find(g=>g.name==="Pending N")?.value.toLocaleString() ?? "235"} sub="awaiting re-inspection" color="yellow" />
        <KPICard label="Pending (Z)"     value={gradeData.find(g=>g.name==="Pending Z")?.value.toLocaleString() ?? "88"} sub="grade under appeal" color="orange" />
        <KPICard label="Worst Avg Score" value={String(Math.max(...(byBorough ?? foodByBorough).map(b => b.avgScore)))} sub={(byBorough ?? foodByBorough).reduce((a, b) => a.avgScore > b.avgScore ? a : b).borough} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <ViolationsByCuisineChart data={byCuisine ?? foodByCuisine} />
        <GradeDistributionChart   data={grades    ?? gradeDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ScoreByBoroughChart data={byBorough ?? foodByBorough} />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">Scoring Guide</h3>
          <p className="text-xs text-dim leading-relaxed">
            NYC scores are penalty-based — <strong className="text-text">lower is better</strong>.
            Grade A = 0–13 points. Grade B = 14–27. Grade C = 28+.
          </p>
          <p className="text-xs text-dim leading-relaxed mt-2">
            <strong className="text-text">N</strong> = not yet graded (initial inspection).
            <strong className="text-text"> Z</strong> = grade pending appeal.
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">Live — updates hourly from NYC DOHMH</p>
          </div>
          <p className="text-[10px] text-muted mt-1">data.cityofnewyork.us/resource/43nn-pn8j.json</p>
        </div>
      </div>
    </SectionShell>
  );
}

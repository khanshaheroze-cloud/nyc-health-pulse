import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { ViolationsByCuisineChart, ScoreByBoroughChart, GradeDistributionChart } from "@/components/FoodSafetyCharts";

export default function FoodSafetyPage() {
  return (
    <SectionShell
      icon="🍽️"
      title="Food Safety"
      description="Restaurant inspection results, critical violations, and grade distributions · NYC DOHMH"
      accentColor="rgba(167,139,250,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Grade A" value="311" sub="49% of graded" color="green" />
        <KPICard label="Pending (N)" value="235" sub="37%" color="yellow" />
        <KPICard label="Pending (Z)" value="88" sub="14%" color="orange" />
        <KPICard label="Worst Avg Score" value="32.1" sub="Staten Island" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <ViolationsByCuisineChart />
        <GradeDistributionChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ScoreByBoroughChart />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">Scoring Guide</h3>
          <p className="text-xs text-dim leading-relaxed">
            NYC inspection scores are penalty-based — <strong className="text-text">lower is better</strong>.
            Grade A = 0–13 points. Grade B = 14–27. Grade C = 28+.
          </p>
          <p className="text-xs text-dim leading-relaxed mt-2">
            <strong className="text-text">N</strong> = not yet graded (initial inspection).
            <strong className="text-text"> Z</strong> = grade pending appeal.
            Restaurants scoring 14+ on initial inspection get a re-inspection within ~1 month.
          </p>
          <p className="text-[10px] text-muted mt-3">
            API: data.cityofnewyork.us/resource/43nn-pn8j.json
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

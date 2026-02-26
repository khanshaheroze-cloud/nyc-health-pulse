import { SectionShell } from "@/components/SectionShell";
import { VitaminDChart, DeficiencyRiskChart } from "@/components/NutritionCharts";

export default function NutritionPage() {
  return (
    <SectionShell
      icon="🥗"
      title="Nutrition & Vitamin Deficiencies"
      description="Population-level nutritional data from NYC HANES, CDC NHANES, and USDA Food Access Atlas"
      accentColor="rgba(245,197,66,.12)"
    >
      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-xl p-4 mb-4">
        <h3 className="text-sm font-bold mb-2">Data Gap Notice</h3>
        <p className="text-xs text-dim leading-relaxed">
          <strong className="text-text">No current NYC-specific vitamin biomarker dataset</strong> exists by
          borough/neighborhood. NYC HANES (the last NYC-specific nutrition survey) was conducted
          in 2013–14. National NHANES data is used as a proxy. This is a genuine civic data
          gap worth highlighting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <VitaminDChart />
        <DeficiencyRiskChart />
      </div>
    </SectionShell>
  );
}

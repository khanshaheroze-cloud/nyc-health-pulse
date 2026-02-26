import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { CovidMonthlyChart, CovidBoroughChart } from "@/components/CovidCharts";

export default function CovidPage() {
  return (
    <SectionShell
      icon="🦠"
      title="COVID-19"
      description="Daily borough-level cases, hospitalizations, and deaths · Feb 2020 – Oct 2025"
      accentColor="rgba(91,156,245,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Cases (90d)" value="16,664" sub="All boroughs" color="blue" />
        <KPICard label="Hospitalizations" value="1,636" sub="9.8% of cases" color="orange" />
        <KPICard label="Deaths" value="74" sub="0.44% fatality" color="red" />
        <KPICard label="Highest Borough" value="Queens" sub="4,825 cases" color="purple" />
      </div>

      <div className="mb-3">
        <CovidMonthlyChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CovidBoroughChart />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">Data Source</h3>
          <p className="text-xs text-dim leading-relaxed">
            github.com/nychealth/coronavirus-data — 2,054 daily records from NYC DOHMH.
            Cases include confirmed + probable. Hospitalizations are COVID-confirmed admissions.
          </p>
          <p className="text-[10px] text-muted mt-3">
            Deaths shown as line on secondary Y-axis in monthly trend chart.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  OverdoseTrendChart,
  OverdoseBoroughChart,
  LeadTrendChart,
  LeadBoroughChart,
} from "@/components/OverdoseCharts";

export default function OverdosePage() {
  return (
    <SectionShell
      icon="💊"
      title="Overdose Deaths & Lead Exposure"
      description="Drug poisoning mortality trends · Child blood lead levels by borough · NYC DOHMH"
      accentColor="rgba(245,197,66,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="2024 OD Deaths" value="2,235" sub="↓28% from 2023 peak" color="green" />
        <KPICard label="Peak Year" value="3,104" sub="2023 · All-time high" color="red" />
        <KPICard label="Child Lead 2023" value="1.8%" sub="Elevated BLL · historic low" color="green" />
        <KPICard label="Lead Highest" value="Bronx" sub="2.8% elevated" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <OverdoseTrendChart />
        <OverdoseBoroughChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LeadTrendChart />
        <LeadBoroughChart />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mt-3">
        <h3 className="text-[13px] font-bold mb-2">Data Sources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-dim">
          <div>
            <p className="font-semibold text-text mb-1">Overdose Deaths</p>
            <p>NYC DOHMH Vital Statistics — drug poisoning mortality. 2024 figure is preliminary estimate. Fentanyl involved in ~80% of cases.</p>
          </div>
          <div>
            <p className="font-semibold text-text mb-1">Child Blood Lead</p>
            <p>NYC DOHMH childhood lead surveillance — children tested before age 6. Elevated BLL = ≥3.5 μg/dL (CDC reference value).</p>
            <p className="mt-1 text-[10px] text-muted">API: data.cityofnewyork.us/resource/9kzi-2guh.json</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

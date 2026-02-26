import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { IliFullChart, FluVaccinationChart } from "@/components/FluCharts";

export default function FluPage() {
  return (
    <SectionShell
      icon="🤒"
      title="Influenza-Like Illness"
      description="ER visit proportion by borough · NYC DOHMH EpiQuery · Wk42 2025 – Wk3 2026"
      accentColor="rgba(245,158,66,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Current Rate" value="3.84%" sub="Wk3 2026 · ↓ Declining" color="orange" />
        <KPICard label="Season Peak" value="11.03%" sub="Wk51 — winter surge" color="red" />
        <KPICard label="Highest Borough" value="Bronx" sub="Consistently elevated" color="red" />
      </div>

      <div className="mb-3">
        <IliFullChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <FluVaccinationChart />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">About ILI Surveillance</h3>
          <p className="text-xs text-dim leading-relaxed">
            ILI (Influenza-Like Illness) is defined as fever ≥100°F plus cough or sore throat.
            Rate = % of all ER visits with ILI diagnosis. NYC DOHMH pulls from 53 sentinel hospitals.
          </p>
          <p className="text-xs text-dim leading-relaxed mt-2">
            Vaccination data: NYC DOHMH 2023–24 season survey of adults 18+.
            The Bronx has the lowest vaccination rate and highest ILI burden — a consistent pattern.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

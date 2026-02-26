import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  HealthOutcomesChart,
  HealthBehaviorsChart,
  ErCausesChart,
  AsthmaByBoroughChart,
  LifeExpectancyChart,
  PreTermBirthChart,
  ChildhoodObesityChart,
  MentalHealthEdTrendChart,
} from "@/components/ChronicDiseaseCharts";
import { BoroughMap } from "@/components/BoroughMap";

export default function ChronicDiseasePage() {
  return (
    <SectionShell
      icon="🏥"
      title="Chronic Disease & Health Behaviors"
      description="CDC PLACES census-tract estimates · BRFSS model-based · SPARCS hospital data"
      accentColor="rgba(240,112,112,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Obesity (Bronx)" value="32.1%" sub="Highest borough" color="red" />
        <KPICard label="Diabetes (Bronx)" value="15.8%" sub="Highest borough" color="orange" />
        <KPICard label="Depression (SI)" value="22.1%" sub="Highest borough" color="purple" />
        <KPICard label="Uninsured (Bronx)" value="14.2%" sub="Highest borough" color="blue" />
      </div>

      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-xl p-4 mb-4">
        <h3 className="text-sm font-bold mb-1">CDC PLACES Note</h3>
        <p className="text-xs text-dim leading-relaxed">
          These are <strong className="text-text">statistical model estimates</strong>, not direct measurements.
          CDC PLACES uses BRFSS survey data modeled down to census-tract level.
          Endpoint: <code className="text-hp-cyan text-[11px]">data.cdc.gov/resource/cwsq-ngmh.json</code>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <HealthOutcomesChart />
        <HealthBehaviorsChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <AsthmaByBoroughChart />
        <LifeExpectancyChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <PreTermBirthChart />
        <ChildhoodObesityChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <MentalHealthEdTrendChart />
        <ErCausesChart />
      </div>

      {/* Borough map */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-[13px] font-bold mb-0.5">Obesity Rate by Borough — Map View</h3>
        <p className="text-[11px] text-dim mb-3">
          % of adults · CDC PLACES 2023 · red = higher prevalence
        </p>
        <BoroughMap metric="obesity" height={360} />
      </div>
    </SectionShell>
  );
}

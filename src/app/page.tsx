import { KPICard } from "@/components/KPICard";
import {
  CovidTrendChart,
  AirTrendChart,
  IliChart,
  ChronicChart,
} from "@/components/OverviewCharts";
import { kpiCards } from "@/lib/data";

export default function OverviewPage() {
  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <CovidTrendChart />
        <AirTrendChart />
        <IliChart />
        <ChronicChart />
      </div>
    </>
  );
}

import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { AirNowWidget } from "@/components/AirNowWidget";
import { Pm25NeighborhoodChart, PollutantsByBoroughChart, Pm25TrendChart } from "@/components/AirQualityCharts";
import { BoroughMap } from "@/components/BoroughMap";

export default function AirQualityPage() {
  return (
    <SectionShell
      icon="🌬️"
      title="Air Quality"
      description="PM2.5, NO₂, and Ozone across 42 neighborhoods · EPA AirNow + NYC Community Air Survey (NYCCAS)"
      accentColor="rgba(45,212,160,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Citywide PM2.5" value="6.66" unit="μg/m³" sub="Annual 2023" color="green" />
        <KPICard label="Worst Area" value="8.08" sub="Chelsea-Clinton" color="orange" />
        <KPICard label="Best Area" value="6.12" sub="S Beach-Tottenville" color="green" />
        <KPICard label="NO₂ (Manhattan)" value="19.5" unit="ppb" sub="Highest borough" color="blue" />
      </div>

      {/* Live AQI widget */}
      <AirNowWidget />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <PollutantsByBoroughChart />
        <Pm25TrendChart />
      </div>

      <div className="mb-4">
        <Pm25NeighborhoodChart />
      </div>

      {/* Borough map */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-[13px] font-bold mb-0.5">PM2.5 by Borough — Map View</h3>
        <p className="text-[11px] text-dim mb-3">Annual average μg/m³ · NYCCAS 2023 · green = lower pollution</p>
        <BoroughMap metric="pm25" height={360} />
      </div>
    </SectionShell>
  );
}

import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  RodentByBoroughChart, RodentHotspotsChart,
  NoiseByBoroughChart, NoiseByTypeChart, FoodDesertChart,
} from "@/components/EnvironmentCharts";
import { fetchRodentByBorough, fetchNoiseByBorough, fetchNoiseByType } from "@/lib/liveData";
import { rodentByBorough, noiseByBorough, noiseByType } from "@/lib/data";

export default async function EnvironmentPage() {
  const [rodentData, noiseBorough, noiseType] = await Promise.all([
    fetchRodentByBorough(),
    fetchNoiseByBorough(),
    fetchNoiseByType(),
  ]);

  const rodent        = rodentData ?? rodentByBorough;
  const noiseTotal    = (noiseBorough ?? noiseByBorough).reduce((s, d) => s + d.complaints, 0);
  const rodentActive  = rodent.reduce((s, d) => s + d.active, 0);
  const rodentTotal   = rodent.reduce((s, d) => s + d.total, 0);
  const activeRate    = rodentTotal > 0 ? Math.round((rodentActive / rodentTotal) * 1000) : 170;

  return (
    <SectionShell
      icon="🐀"
      title="Environmental Health"
      description="Rodent activity, drinking water quality, 311 noise complaints, and food desert mapping"
      accentColor="rgba(34,211,238,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Rat Activity"      value={activeRate.toString()} sub="Active per 1K inspections · 30d" color="red" />
        <KPICard label="Water Safety"      value="99.9%"  sub="1 coliform / 1,000 tests" color="cyan" />
        <KPICard label="Noise Complaints"  value={noiseTotal.toLocaleString()} sub="Last 7 days · 311" color="blue" />
        <KPICard label="Bronx Food Deserts" value="28.3%" sub="Low-access census tracts" color="orange" />
      </div>

      {/* Water quality table */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-3">
        <h3 className="text-sm font-bold mb-3">Drinking Water Quality</h3>
        <table className="w-full text-xs border-collapse">
          <tbody>
            {[
              ["Avg Free Chlorine", "0.645 mg/L", "Normal"],
              ["Range",             "0.11 – 1.12 mg/L", null],
              ["Coliform Detected", "1 of 1,000 (0.1%)", null],
              ["E. coli Detected",  "1 of 1,000 (0.1%)", null],
              ["EPA Standard",      "0.2 – 4.0 mg/L",    "Compliant"],
            ].map(([label, value, badge]) => (
              <tr key={label as string} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 text-dim">{label}</td>
                <td className="py-2 font-semibold">
                  {value}{" "}
                  {badge && (
                    <span className="text-hp-green bg-hp-green/10 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RodentByBoroughChart data={rodentData ?? rodentByBorough} />
        <NoiseByBoroughChart  data={noiseBorough ?? noiseByBorough} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RodentHotspotsChart />
        <div className="flex flex-col gap-3">
          <NoiseByTypeChart data={noiseType ?? noiseByType} />
          <FoodDesertChart />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
        <p className="text-[10px] text-hp-green font-semibold">Rodent + Noise data live from NYC Open Data · updates hourly</p>
      </div>
    </SectionShell>
  );
}

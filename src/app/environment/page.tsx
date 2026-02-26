import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  RodentByBoroughChart,
  RodentHotspotsChart,
  NoiseByBoroughChart,
  NoiseByTypeChart,
  FoodDesertChart,
} from "@/components/EnvironmentCharts";

export default function EnvironmentPage() {
  return (
    <SectionShell
      icon="🐀"
      title="Environmental Health"
      description="Rodent activity, drinking water quality, 311 noise complaints, and food desert mapping"
      accentColor="rgba(34,211,238,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Rat Activity" value="170" sub="Active per 1K inspections" color="red" />
        <KPICard label="Water Safety" value="99.9%" sub="1 coliform / 1,000 tests" color="cyan" />
        <KPICard label="Noise Complaints" value="1,000" sub="Recent 7 days · 311" color="blue" />
        <KPICard label="Bronx Food Deserts" value="28.3%" sub="Low-access census tracts" color="orange" />
      </div>

      {/* Water quality mini-table */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-3">
        <h3 className="text-sm font-bold mb-3">Drinking Water Quality</h3>
        <table className="w-full text-xs border-collapse">
          <tbody>
            {[
              ["Avg Free Chlorine", "0.645 mg/L", "Normal"],
              ["Range", "0.11 – 1.12 mg/L", null],
              ["Coliform Detected", "1 of 1,000 (0.1%)", null],
              ["E. coli Detected", "1 of 1,000 (0.1%)", null],
              ["EPA Standard", "0.2 – 4.0 mg/L", "Compliant"],
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
        <RodentByBoroughChart />
        <NoiseByBoroughChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RodentHotspotsChart />
        <div className="flex flex-col gap-3">
          <NoiseByTypeChart />
          <FoodDesertChart />
        </div>
      </div>
    </SectionShell>
  );
}

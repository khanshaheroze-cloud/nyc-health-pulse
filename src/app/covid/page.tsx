import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { CovidMonthlyChart, CovidBoroughChart } from "@/components/CovidCharts";
import { fetchCovidMonthly, fetchCovidByBorough } from "@/lib/liveData";
import { covidMonthly, covidByBorough } from "@/lib/data";

export default async function CovidPage() {
  const [monthly, byBorough] = await Promise.all([
    fetchCovidMonthly(),
    fetchCovidByBorough(),
  ]);

  const boroughData = byBorough ?? covidByBorough;
  const totalCases  = boroughData.reduce((s, d) => s + d.cases, 0);
  const totalHosp   = boroughData.reduce((s, d) => s + d.hosp,  0);
  const topBorough  = [...boroughData].sort((a, b) => b.cases - a.cases)[0];
  const monthlyData = monthly ?? covidMonthly;
  const totalDeaths = monthlyData.slice(-3).reduce((s, d) => s + (d.deaths ?? 0), 0);

  return (
    <SectionShell
      icon="🦠"
      title="COVID-19"
      description="Borough-level cases, hospitalizations, and deaths · NYC DOHMH · Live"
      accentColor="rgba(91,156,245,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Cases (90d)"      value={totalCases.toLocaleString()} sub="All boroughs" color="blue" />
        <KPICard label="Hospitalizations" value={totalHosp.toLocaleString()}  sub={`${totalCases > 0 ? ((totalHosp/totalCases)*100).toFixed(1) : "9.8"}% of cases`} color="orange" />
        <KPICard label="Deaths (3mo)"     value={totalDeaths.toLocaleString()} sub="Recent 3 months" color="red" />
        <KPICard label="Highest Borough"  value={topBorough?.borough ?? "Queens"} sub={`${topBorough?.cases.toLocaleString() ?? "—"} cases`} color="purple" />
      </div>

      <div className="mb-3">
        <CovidMonthlyChart data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CovidBoroughChart data={boroughData} />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">Data Source</h3>
          <p className="text-xs text-dim leading-relaxed">
            NYC DOHMH daily COVID surveillance — confirmed + probable cases, COVID-confirmed
            hospital admissions, and death certificates. Borough breakdown uses DOHMH borough-prefixed
            columns (bx/bk/mn/qn/si).
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">Live — updates daily from NYC DOHMH</p>
          </div>
          <p className="text-[10px] text-muted mt-1">data.cityofnewyork.us/resource/rc75-m7u3.json</p>
        </div>
      </div>
    </SectionShell>
  );
}

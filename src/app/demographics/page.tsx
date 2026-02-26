import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  RacePctByBoroughChart,
  RaceCountsTable,
  AsianSubgroupsChart,
  AgeByBoroughChart,
  HealthDisparitiesChart,
  LifeExpByRaceChart,
} from "@/components/DemographicsCharts";
import { fetchRaceByBorough } from "@/lib/liveData";
import {
  raceByBorough,
  asianSubgroupsCitywide,
  ageByBorough,
  healthDisparitiesByRace,
  lifeExpectancyByRace,
} from "@/lib/data";

export default async function DemographicsPage() {
  const liveRace = await fetchRaceByBorough();
  const raceData = liveRace ?? raceByBorough;

  // KPI computations
  const totalPop  = raceData.reduce((s, d) => s + d.nhWhite + d.nhBlack + d.nhAsian + d.hispanic + d.other, 0);
  const totalAsian = raceData.reduce((s, d) => s + d.nhAsian, 0);
  const totalHisp  = raceData.reduce((s, d) => s + d.hispanic, 0);

  // Most diverse = smallest max-group share (Queens: largest group is Hispanic at ~28%)
  const mostDiverse = [...raceData].sort((a, b) => {
    const maxShare = (d: typeof a) => {
      const tot = d.nhWhite + d.nhBlack + d.nhAsian + d.hispanic + d.other;
      return Math.max(d.nhWhite, d.nhBlack, d.nhAsian, d.hispanic) / tot;
    };
    return maxShare(a) - maxShare(b);
  })[0];

  const blackGap = (lifeExpectancyByRace.find(d => d.group === "NH Asian")?.years ?? 87.1)
                 - (lifeExpectancyByRace.find(d => d.group === "NH Black")?.years ?? 74.5);

  return (
    <SectionShell
      icon="👥"
      title="Demographics"
      description="Borough population by race & ethnicity, age distribution, and health disparities · ACS 2022 + NYC DOHMH"
      accentColor="rgba(167,139,250,.12)"
    >
      {/* KPI row */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          label="NYC Population"
          value={(totalPop / 1_000_000).toFixed(2) + "M"}
          sub="ACS 2022 · 5-year estimate"
          color="blue"
        />
        <KPICard
          label="Most Diverse Borough"
          value={mostDiverse?.borough ?? "Queens"}
          sub="Smallest dominant-group share"
          color="purple"
        />
        <KPICard
          label="Asian Americans"
          value={(totalAsian / 1_000_000).toFixed(2) + "M"}
          sub={`${((totalAsian / totalPop) * 100).toFixed(1)}% of NYC — 2nd largest US city`}
          color="cyan"
        />
        <KPICard
          label="Hispanic / Latino"
          value={(totalHisp / 1_000_000).toFixed(2) + "M"}
          sub={`${((totalHisp / totalPop) * 100).toFixed(1)}% of NYC`}
          color="orange"
        />
      </div>

      {/* Race charts */}
      <div className="mb-3">
        <RacePctByBoroughChart data={raceData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RaceCountsTable data={raceData} />

        {/* Data gap — MENA + Caribbean */}
        <div className="bg-surface border border-hp-yellow/25 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-[13px] font-bold flex items-center gap-1.5">
            <span className="text-hp-yellow">⚠</span> Census Data Gaps
          </h3>
          <div>
            <p className="text-[11px] font-semibold text-text mb-1">Middle Eastern / North African (MENA)</p>
            <p className="text-[11px] text-dim leading-relaxed">
              MENA populations are classified as <strong className="text-text">Non-Hispanic White</strong> in
              Census B03002. NYC has a substantial Arab-American, Yemeni, Egyptian, and Iranian community — but
              no separate ACS category exists at the county level. A standalone MENA category was piloted in the
              2020 Census but is not yet in ACS 5-year tables.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-text mb-1">Caribbean Heritage</p>
            <p className="text-[11px] text-dim leading-relaxed">
              Afro-Caribbean New Yorkers (Jamaican, Haitian, Trinidadian, Barbadian, etc.) are counted within
              <strong className="text-text"> Non-Hispanic Black</strong>. Caribbean Hispanic (Dominican, Puerto
              Rican, Cuban) are in <strong className="text-text">Hispanic / Latino</strong>. No separate
              &quot;Caribbean&quot; census category exists.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-text mb-1">Central Asian</p>
            <p className="text-[11px] text-dim leading-relaxed">
              Uzbek, Kazakh, Kyrgyz, and other Central Asian communities are counted within
              <strong className="text-text"> Asian alone</strong> (B02015) or White — depending on
              self-identification. Separate ACS estimates are not available at the borough level.
            </p>
          </div>
        </div>
      </div>

      {/* Asian subgroups */}
      <div className="mb-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AsianSubgroupsChart data={asianSubgroupsCitywide} />
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-[13px] font-bold">Asian Subgroup Key</h3>
            <p className="text-[11px] text-dim leading-relaxed">
              NYC is home to the largest South Asian community outside South Asia, and one of the largest
              Chinese-American populations globally.
            </p>
            {[
              { label: "East Asian",       color: "#5b9cf5", groups: "Chinese, Taiwanese, Korean, Japanese" },
              { label: "South Asian",      color: "#f59e42", groups: "Indian, Bangladeshi, Pakistani, Nepalese, Sri Lankan" },
              { label: "Southeast Asian",  color: "#2dd4a0", groups: "Filipino, Vietnamese, Cambodian, Thai, Indonesian & others" },
              { label: "Other Asian",      color: "#6b7a94", groups: "Hmong, Mongolian, Okinawan, and other groups" },
            ].map(({ label, color, groups }) => (
              <div key={label} className="flex gap-2">
                <span className="w-2 h-2 rounded-full mt-0.5 flex-shrink-0" style={{ background: color }} />
                <div>
                  <p className="text-[11px] font-semibold text-text">{label}</p>
                  <p className="text-[10px] text-dim">{groups}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted mt-1 border-l-2 border-muted pl-2">
              Note: Census B02015 does not separately identify Middle Eastern or Central Asian subgroups.
              Uzbek, Kazakh, and similar communities may self-report as Asian or White.
            </p>
          </div>
        </div>
      </div>

      {/* Age distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <AgeByBoroughChart data={ageByBorough} />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center gap-2">
          <h3 className="text-[13px] font-bold">Age Highlights</h3>
          {[
            { label: "Bronx — youngest median age (~34)",       detail: "24% under 18 · highest child share of any borough" },
            { label: "Manhattan — oldest median age (~37)",     detail: "Only 16% under 18 · 16% seniors" },
            { label: "Queens — most working-age adults",        detail: "27% ages 35–54 · large immigrant workforce" },
            { label: "Brooklyn — largest raw senior population",detail: "~380K adults 65+ — more than any other borough" },
          ].map(({ label, detail }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold text-text">{label}</p>
              <p className="text-[10px] text-dim">{detail}</p>
            </div>
          ))}
          <p className="text-[10px] text-muted mt-1">Source: ACS 2022 5-year estimates · B01001</p>
        </div>
      </div>

      {/* Health disparities */}
      <div className="mb-3">
        <HealthDisparitiesChart data={healthDisparitiesByRace} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <LifeExpByRaceChart data={lifeExpectancyByRace} />
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-center gap-2">
          <h3 className="text-[13px] font-bold">Life Expectancy Gap</h3>
          <p className="text-[11px] text-dim leading-relaxed">
            The <strong className="text-text">12.6-year gap</strong> between NH Asian (87.1y) and NH Black
            (74.5y) New Yorkers reflects compounding inequities in housing, air quality, healthcare access,
            chronic disease burden, and wealth.
          </p>
          <p className="text-[11px] text-dim leading-relaxed">
            The Hispanic paradox — higher life expectancy than NH White despite higher poverty rates — is
            observed in NYC and nationally, partly explained by the healthy immigrant effect and stronger
            family support networks.
          </p>
          <div className="mt-2 bg-hp-red/5 border border-hp-red/20 rounded-lg p-2">
            <p className="text-[10px] text-hp-red font-semibold">Bronx effect</p>
            <p className="text-[10px] text-dim">
              The Bronx (life exp. 79.0y, lowest of any NYC borough) has the highest share of Black and
              Hispanic residents — health geography and race are deeply intertwined.
            </p>
          </div>
          <p className="text-[10px] text-muted mt-1">Source: NYC DOHMH Vital Statistics 2019 (pre-COVID baseline)</p>
        </div>
      </div>

      {/* Methodology note */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-[13px] font-bold mb-2">Data Sources &amp; Methodology</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] text-dim leading-relaxed">
          <div>
            <p className="font-semibold text-text mb-1">Race / Ethnicity (B03002)</p>
            <p>
              U.S. Census Bureau ACS 5-year estimates 2022. Population counts query the Census API daily
              (revalidated monthly). Race categories follow the Census OMB standard: people can identify with
              one or more races; Hispanic / Latino is an ethnicity, not a race, and can be any race.
            </p>
          </div>
          <div>
            <p className="font-semibold text-text mb-1">Health Disparities (NYC CHS)</p>
            <p>
              NYC DOHMH Community Health Survey 2022. Telephone survey of ~10,000 NYC adults annually.
              Estimates are weighted to be representative of NYC adults 18+ and carry a margin of error
              (typically ±2–4 percentage points). Asian health data may under-represent newer immigrant
              groups due to language barriers in survey administration.
            </p>
          </div>
        </div>
        {liveRace && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">Race / ethnicity data live from U.S. Census ACS API</p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

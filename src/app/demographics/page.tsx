import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Demographics — Race, Income, Poverty & Insurance",
  description: "Census demographic data for NYC. Race/ethnicity, median income, poverty rate, and uninsured rate by borough. Live data from U.S. Census ACS.",
};
import { datasetJsonLdString, CENSUS_LICENSE, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { SubwayBullet, BOROUGH_LINE } from "@/components/SubwayBullet";
import {
  RacePctByBoroughChart,
  RaceCountsTable,
  AsianSubgroupsChart,
  AgeByBoroughChart,
  HealthDisparitiesChart,
  LifeExpByRaceChart,
  PovertyByBoroughChart,
  MedianIncomeChart,
  UninsuredByBoroughChart,
} from "@/components/DemographicsCharts";
import { fetchRaceByBorough, fetchPovertyByBorough, fetchMedianIncomeByBorough, fetchUninsuredByBorough } from "@/lib/liveData";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  raceByBorough,
  asianSubgroupsCitywide,
  ageByBorough,
  healthDisparitiesByRace,
  lifeExpectancyByRace,
} from "@/lib/data";

export default async function DemographicsPage() {
  const [liveRace, poverty, income, uninsured] = await Promise.all([
    fetchRaceByBorough(),
    fetchPovertyByBorough(),
    fetchMedianIncomeByBorough(),
    fetchUninsuredByBorough(),
  ]);
  const liveAt = new Date().toISOString();

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

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Demographics — Race, Ethnicity & Age by Borough (U.S. Census ACS)",
      description: "Population by race/ethnicity (NH White, NH Black, NH Asian, Hispanic, Other) and age distribution for all five NYC boroughs from the U.S. Census American Community Survey.",
      pagePath: "/demographics",
      license: CENSUS_LICENSE,
      temporalCoverage: "2019/2023",
      distribution: [
        { name: "Census ACS B03002 (Race/Ethnicity)", contentUrl: "https://api.census.gov/data/2023/acs/acs5" },
        { name: "Census ACS B01001 (Age/Sex)", contentUrl: "https://api.census.gov/data/2023/acs/acs5" },
      ],
      variableMeasured: ["Population by Race/Ethnicity", "Population by Age Group", "Asian Subgroup Populations"],
    },
    {
      name: "NYC Economic Indicators — Poverty, Income & Uninsured by Borough",
      description: "Poverty rate, median household income, and health insurance coverage by NYC borough from U.S. Census ACS.",
      pagePath: "/demographics",
      license: CENSUS_LICENSE,
      temporalCoverage: "2019/2023",
      distribution: [
        { name: "Census ACS B17001 (Poverty)", contentUrl: "https://api.census.gov/data/2023/acs/acs5" },
        { name: "Census ACS B19013 (Median Income)", contentUrl: "https://api.census.gov/data/2023/acs/acs5" },
        { name: "Census ACS S2701 (Uninsured)", contentUrl: "https://api.census.gov/data/2023/acs/acs5/subject" },
      ],
      variableMeasured: ["Poverty Rate (%)", "Median Household Income ($)", "Uninsured Rate (%)"],
    },
    {
      name: "NYC Health Disparities by Race — Life Expectancy & Chronic Disease",
      description: "Health outcome disparities by race/ethnicity in NYC including life expectancy, obesity, diabetes, and smoking rates from NYC DOHMH Community Health Survey.",
      pagePath: "/demographics",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2019/2022",
      distribution: [
        { name: "NYC DOHMH Community Health Survey", contentUrl: "https://www.nyc.gov/site/doh/data/data-tools/community-health-survey.page" },
      ],
      variableMeasured: ["Life Expectancy by Race (years)", "Obesity Rate by Race (%)", "Diabetes Rate by Race (%)", "Smoking Rate by Race (%)"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="👥"
      title="Demographics"
      description="Borough population by race & ethnicity, age distribution, and health disparities · ACS 2023 + NYC DOHMH"
      accentColor="rgba(167,139,250,.12)"
    >
      {/* KPI row */}
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          label="NYC Population"
          value={(totalPop / 1_000_000).toFixed(2) + "M"}
          sub="ACS 2023 · 5-year estimate"
          color="blue"
          tag="2023"
        />
        <KPICard
          label="Most Diverse Borough"
          value={mostDiverse?.borough ?? "Queens"}
          sub="Smallest dominant-group share"
          color="purple"
          tag="2023"
        />
        <KPICard
          label="Asian Americans"
          value={(totalAsian / 1_000_000).toFixed(2) + "M"}
          sub={`${((totalAsian / totalPop) * 100).toFixed(1)}% of NYC — 2nd largest US city`}
          color="cyan"
          tag="2023"
        />
        <KPICard
          label="Hispanic / Latino"
          value={(totalHisp / 1_000_000).toFixed(2) + "M"}
          sub={`${((totalHisp / totalPop) * 100).toFixed(1)}% of NYC`}
          color="orange"
          tag="2023"
        />
        {poverty && (
          <KPICard
            label="Poverty (Highest)"
            value={[...poverty].sort((a, b) => b.pct - a.pct)[0].borough}
            sub={`${[...poverty].sort((a, b) => b.pct - a.pct)[0].pct}% below poverty line`}
            color="red"
            tag="2023"
          />
        )}
        {income && (
          <KPICard
            label="Median Income (Highest)"
            value={[...income].sort((a, b) => b.income - a.income)[0].borough}
            sub={`$${[...income].sort((a, b) => b.income - a.income)[0].income.toLocaleString()}`}
            color="green"
            tag="2023"
          />
        )}
        {uninsured && (
          <KPICard
            label="Uninsured (Highest)"
            value={[...uninsured].sort((a, b) => b.pct - a.pct)[0].borough}
            sub={`${[...uninsured].sort((a, b) => b.pct - a.pct)[0].pct}% without coverage`}
            color="red"
            tag="2023"
          />
        )}
      </div>
      </ScrollReveal>

      {/* Race charts */}
      <ScrollReveal delay={100}>
      <div className="mb-3">
        <RacePctByBoroughChart data={raceData} lastUpdated={liveAt} />
      </div>
      </ScrollReveal>

      <ScrollReveal delay={150}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RaceCountsTable data={raceData} />

        {/* Data gap — MENA + Caribbean */}
        <div className="bg-surface border border-hp-yellow/25 rounded-3xl p-6 flex flex-col gap-3">
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
      </ScrollReveal>

      {/* Asian subgroups */}
      <ScrollReveal delay={200}>
      <div className="mb-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AsianSubgroupsChart data={asianSubgroupsCitywide} />
          <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col gap-3">
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
      </ScrollReveal>

      {/* Age distribution */}
      <ScrollReveal delay={250}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <AgeByBoroughChart data={ageByBorough} />
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col justify-center gap-2">
          <h3 className="text-[13px] font-bold">Age Highlights</h3>
          {[
            { borough: "Bronx",     label: "Youngest median age (~34)",       detail: "24% under 18 · highest child share of any borough" },
            { borough: "Manhattan", label: "Oldest median age (~37)",         detail: "Only 16% under 18 · 16% seniors" },
            { borough: "Queens",    label: "Most working-age adults",         detail: "27% ages 35–54 · large immigrant workforce" },
            { borough: "Brooklyn",  label: "Largest raw senior population",   detail: "~380K adults 65+ — more than any other borough" },
          ].map(({ borough, label, detail }) => (
            <div key={borough} className="flex items-start gap-2">
              <SubwayBullet line={BOROUGH_LINE[borough] ?? "S"} size={18} />
              <div>
                <p className="text-[11px] font-semibold text-text">{borough} — {label}</p>
                <p className="text-[10px] text-dim">{detail}</p>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted mt-1">Source: ACS 2023 5-year estimates · B01001</p>
        </div>
      </div>
      </ScrollReveal>

      {/* Poverty, Income & Uninsured */}
      {(poverty || income || uninsured) && (
        <div className={`grid grid-cols-1 gap-3 mb-3 ${poverty && income && uninsured ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {poverty   && <PovertyByBoroughChart data={poverty} lastUpdated={liveAt} />}
          {income    && <MedianIncomeChart data={income} lastUpdated={liveAt} />}
          {uninsured && <UninsuredByBoroughChart data={uninsured} lastUpdated={liveAt} />}
        </div>
      )}

      {/* Health disparities */}
      <ScrollReveal delay={300}>
      <div className="mb-3">
        <HealthDisparitiesChart data={healthDisparitiesByRace} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <LifeExpByRaceChart data={lifeExpectancyByRace} />
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col justify-center gap-2">
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
            <p className="text-[10px] text-hp-red font-semibold flex items-center gap-1.5">
              <SubwayBullet line="4" size={14} />
              Bronx effect
            </p>
            <p className="text-[10px] text-dim">
              The Bronx (life exp. 79.0y, lowest of any NYC borough) has the highest share of Black and
              Hispanic residents — health geography and race are deeply intertwined.
            </p>
          </div>
          <p className="text-[10px] text-muted mt-1">Source: NYC DOHMH Vital Statistics 2019 (pre-COVID baseline)</p>
        </div>
      </div>
      </ScrollReveal>

      {/* Methodology note */}
      <ScrollReveal delay={350}>
      <div className="bg-surface border border-border-light rounded-3xl p-6">
        <h3 className="text-[13px] font-bold mb-2">Data Sources &amp; Methodology</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] text-dim leading-relaxed">
          <div>
            <p className="font-semibold text-text mb-1">Race / Ethnicity (B03002)</p>
            <p>
              U.S. Census Bureau ACS 5-year estimates 2023 (released Dec 2024). Population counts query the Census API
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
        {(liveRace || poverty || income) && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">
              Race, poverty, and income data live from U.S. Census ACS API · revalidates monthly
            </p>
          </div>
        )}
      </div>
      </ScrollReveal>
    </SectionShell>
    </>
  );
}

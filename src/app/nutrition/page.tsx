import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Nutrition — Vitamin Deficiencies, Food Access & Youth Health",
  description: "Nutritional data for NYC. Vitamin D and iron deficiency rates, youth obesity trends, farmers markets, SNAP/EBT access, and food resource programs.",
};
import { datasetJsonLdString, CDC_DATA_LICENSE, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { VitaminDChart, DeficiencyRiskChart } from "@/components/NutritionCharts";
import { YouthRiskTrendChart } from "@/components/YouthHealthCharts";
import { KPICard } from "@/components/KPICard";
import { FarmersMarketList } from "@/components/FarmersMarketList";
import { fetchYouthRiskBehavior, fetchFarmersMarkets } from "@/lib/liveData";

export const revalidate = 86400;

export default async function NutritionPage() {
  const [yrbs, markets] = await Promise.all([
    fetchYouthRiskBehavior(),
    fetchFarmersMarkets(),
  ]);

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Nutrition & Vitamin Deficiency Data — NHANES Proxy Estimates",
      description: "Population-level vitamin D and iron deficiency prevalence estimates for NYC using CDC NHANES national data as a proxy. NYC HANES (2013-14) is the last city-specific nutrition survey.",
      pagePath: "/nutrition",
      license: CDC_DATA_LICENSE,
      temporalCoverage: "2017/2020",
      distribution: [
        { name: "CDC NHANES Data", contentUrl: "https://wwwn.cdc.gov/nchs/nhanes/" },
      ],
      variableMeasured: ["Vitamin D Deficiency (%)", "Iron Deficiency (%)", "Deficiency Risk by Demographic Group"],
    },
    {
      name: "NYC Youth Risk Behavior Survey — Obesity, Activity & Substance Use",
      description: "NYC high school student health behavior trends including obesity, soda consumption, physical activity, and smoking from the NYC Youth Risk Behavior Survey (YRBS).",
      pagePath: "/nutrition",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2005/..",
      distribution: [
        { name: "NYC YRBS Data", contentUrl: "https://data.cityofnewyork.us/resource/3qty-g4aq.json" },
      ],
      variableMeasured: ["Youth Obesity (%)", "Soda Consumption (%)", "Physical Activity (%)", "Smoking (%)"],
    },
    {
      name: "NYC DOHMH Farmers Markets",
      description: "Locations, hours, and SNAP/EBT acceptance status of NYC farmers markets from the NYC Department of Health and Mental Hygiene.",
      pagePath: "/nutrition",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2024/..",
      distribution: [
        { name: "NYC Farmers Markets", contentUrl: "https://data.cityofnewyork.us/resource/8vwk-6iz2.json" },
      ],
      variableMeasured: ["Market Count", "SNAP/EBT Acceptance"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🥗"
      title="Nutrition & Food Access"
      description="Population-level nutritional data, food resource programs, and fresh food access across NYC"
      accentColor="rgba(245,197,66,.12)"
    >
      {/* ── NYC Diet by the Numbers ── */}
      <h3 className="text-sm font-bold mb-2">NYC Diet by the Numbers</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <KPICard
          label="Overweight or Obese"
          value="58%"
          sub="NYC adults (2022 CHS)"
          color="orange"
          tag="2022"
          tooltip="Percentage of NYC adults with BMI ≥ 25. Source: NYC Community Health Survey."
        />
        <KPICard
          label="Eat 5+ Fruits/Veg Daily"
          value="10%"
          sub="Only 1 in 10 adults"
          color="green"
          tag="2022"
          badge={{ text: "Below target", type: "warn" }}
          tooltip="Percentage of NYC adults eating 5 or more servings of fruits and vegetables per day. CDC recommends 5-9 servings."
        />
        <KPICard
          label="Bronx Food Deserts"
          value="28.3%"
          sub="Census tracts vs Manhattan 8.2%"
          color="red"
          tag="2019"
          tooltip="Percentage of census tracts classified as food deserts by the USDA — low income and low access to a supermarket within 0.5 miles."
        />
      </div>

      {/* ── Data Gap Advocacy Callout ── */}
      <div className="bg-hp-yellow/8 border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-xl p-5 mb-5">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">!</span>
          <div>
            <h3 className="text-sm font-bold mb-1">NYC doesn&apos;t know its own vitamin levels</h3>
            <p className="text-xs text-dim leading-relaxed mb-2">
              The last NYC-specific nutrition biomarker survey (<strong className="text-text">NYC HANES</strong>) was
              conducted in <strong className="text-text">2013-14</strong> — over a decade ago. No current
              NYC-specific data exists for vitamin D, iron, or other micronutrient deficiencies by
              borough or neighborhood.
            </p>
            <p className="text-xs text-dim leading-relaxed mb-2">
              National NHANES data is used as a proxy below, but NYC&apos;s demographics, diet patterns,
              and sun exposure differ significantly from national averages. This is a genuine civic data
              gap that affects nutrition policy for 8.3 million residents.
            </p>
            <p className="text-[11px] text-muted">
              Advocate for a new NYC HANES at{" "}
              <a href="https://www.nyc.gov/site/doh/about/about-doh/contact-us.page" target="_blank" rel="noopener noreferrer" className="underline text-hp-blue hover:text-hp-blue/80">
                NYC DOHMH
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Vitamin Deficiency Charts ── */}
      <h3 className="text-sm font-bold mb-2">Vitamin Deficiency Estimates (NHANES Proxy)</h3>
      <p className="text-[12px] text-dim mb-3">
        National NHANES data used as NYC proxy. Actual NYC rates may differ due to demographics and urban lifestyle.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <VitaminDChart />
        <DeficiencyRiskChart />
      </div>

      {/* ── Youth Health Behaviors ── */}
      {yrbs && yrbs.length > 0 && (
        <>
          <h3 className="text-sm font-bold mb-2 mt-5">Youth Health Behaviors</h3>
          <p className="text-[12px] text-dim mb-3">
            NYC high school students (grades 9-12) — obesity, soda consumption, physical activity,
            and substance use trends from the NYC Youth Risk Behavior Survey.
          </p>
          <YouthRiskTrendChart data={yrbs} />
        </>
      )}

      {/* ── Eating Well in NYC — Resource Cards ── */}
      <h3 className="text-sm font-bold mb-2 mt-6">Eating Well in NYC</h3>
      <p className="text-[12px] text-dim mb-3">
        Free and low-cost food programs available to all New Yorkers — no strings attached.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <ResourceCard
          icon="💚"
          title="Health Bucks"
          description="Get $2 coupons for every $5 spent with SNAP at NYC farmers markets. Use them for fresh fruits and vegetables."
          href="https://www.nyc.gov/site/doh/health/health-topics/health-bucks.page"
          linkLabel="nyc.gov/health-bucks"
          accent="green"
        />
        <ResourceCard
          icon="🍽️"
          title="GetFood NYC"
          description="Free meals for all New Yorkers. No ID, no documentation, no questions asked. 500+ community meal sites citywide."
          href="https://www.nyc.gov/site/hra/help/food-assistance.page"
          linkLabel="nyc.gov/getfood"
          accent="blue"
        />
        <ResourceCard
          icon="🥬"
          title="GrowNYC Greenmarkets"
          description="50+ farmers markets across all five boroughs. Local produce, year-round locations, many accept SNAP/EBT."
          href="https://www.grownyc.org/greenmarket"
          linkLabel="grownyc.org"
          accent="green"
        />
        <ResourceCard
          icon="👶"
          title="WIC Locations"
          description="Nutrition support for pregnant women, new mothers, and children under 5. Includes food vouchers and nutrition counseling."
          href="https://www.nyc.gov/site/doh/health/health-topics/wic.page"
          linkLabel="nyc.gov/wic"
          accent="pink"
        />
        <ResourceCard
          icon="🏷️"
          title="SNAP Enrollment"
          description="Apply for SNAP benefits (food stamps) online. Most NYC residents earning under $2,500/month for a family of 4 qualify."
          href="https://access.nyc.gov/programs/snap/"
          linkLabel="access.nyc.gov"
          accent="purple"
        />
      </div>

      {/* ── Fresh Food Access — Farmers Markets ── */}
      {markets && markets.length > 0 && (
        <>
          <h3 className="text-sm font-bold mb-2 mt-6">Fresh Food Access — NYC Farmers Markets</h3>
          <p className="text-[12px] text-dim mb-3">
            Live directory from NYC DOHMH. Markets accepting SNAP/EBT are highlighted — use Health Bucks
            for extra savings on fresh produce.
          </p>
          <FarmersMarketList markets={markets} />
        </>
      )}
    </SectionShell>
    </>
  );
}

/* ── Resource Card helper ── */

function ResourceCard({
  icon,
  title,
  description,
  href,
  linkLabel,
  accent,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  accent: "green" | "blue" | "purple" | "pink" | "orange";
}) {
  const accentMap = {
    green:  "border-hp-green/30 hover:border-hp-green/50",
    blue:   "border-hp-blue/30 hover:border-hp-blue/50",
    purple: "border-hp-purple/30 hover:border-hp-purple/50",
    pink:   "border-hp-pink/30 hover:border-hp-pink/50",
    orange: "border-hp-orange/30 hover:border-hp-orange/50",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-surface border ${accentMap[accent]} rounded-xl p-4 flex flex-col gap-1.5 transition-colors group`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="font-semibold text-sm text-text group-hover:text-hp-blue transition-colors">{title}</span>
      </div>
      <p className="text-[11px] text-dim leading-relaxed">{description}</p>
      <span className="text-[10px] text-hp-blue font-semibold mt-auto pt-1">{linkLabel} &rarr;</span>
    </a>
  );
}

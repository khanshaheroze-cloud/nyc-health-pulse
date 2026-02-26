import { SectionShell } from "@/components/SectionShell";

const sources = [
  {
    name: "Air Quality (NYCCAS)",
    tag: "5,000 rows · Socrata API",
    tagColor: "#2dd4a0",
    desc: "PM2.5, NO₂, O₃ by 42 UHF neighborhoods. data.cityofnewyork.us/resource/c3uy-2p5r.json",
  },
  {
    name: "COVID-19",
    tag: "2,054 rows · GitHub",
    tagColor: "#2dd4a0",
    desc: "Daily borough cases/hosp/deaths. github.com/nychealth/coronavirus-data",
  },
  {
    name: "ILI Surveillance",
    tag: "525 rows · DOHMH EpiQuery",
    tagColor: "#2dd4a0",
    desc: "Weekly ER visit ratios by borough and age group.",
  },
  {
    name: "Food Safety",
    tag: "1,000 rows · Socrata",
    tagColor: "#2dd4a0",
    desc: "Restaurant inspections/grades. data.cityofnewyork.us/resource/43nn-pn8j.json",
  },
  {
    name: "Rodent Inspections",
    tag: "1,000 rows · Socrata",
    tagColor: "#2dd4a0",
    desc: "Rat activity by location. data.cityofnewyork.us/resource/p937-wjvj.json",
  },
  {
    name: "Water Quality (DEP)",
    tag: "1,000 rows · Socrata",
    tagColor: "#2dd4a0",
    desc: "Chlorine, turbidity, coliform. data.cityofnewyork.us/resource/bkwf-xfky.json",
  },
  {
    name: "311 Noise Complaints",
    tag: "1,000 rows · 311 API",
    tagColor: "#2dd4a0",
    desc: "Geocoded noise complaints. data.cityofnewyork.us/resource/erm2-nwe9.json",
  },
  {
    name: "CDC PLACES",
    tag: "Socrata · data.cdc.gov",
    tagColor: "#5b9cf5",
    desc: "29+ health measures at census-tract level. /resource/cwsq-ngmh.json. Filter by NY county.",
  },
  {
    name: "EPA AirNow",
    tag: "REST API · Hourly",
    tagColor: "#5b9cf5",
    desc: "Real-time AQI, PM2.5, O₃ by zip code. Free key at airnow.gov/get-started.",
  },
  {
    name: "USDA Food Access Atlas",
    tag: "CSV · ers.usda.gov",
    tagColor: "#5b9cf5",
    desc: "Food desert census tracts — low-income areas with limited supermarket access.",
  },
  {
    name: "Overdose Deaths",
    tag: "NYC Open Data · DOHMH",
    tagColor: "#5b9cf5",
    desc: "Unintentional drug poisoning deaths by borough, substance, year. 2017–2024.",
  },
  {
    name: "Child Blood Lead",
    tag: "NYC Open Data · 9kzi-2guh",
    tagColor: "#5b9cf5",
    desc: "Annual rates of elevated BLL (≥5 μg/dL) in children under 6.",
  },
  {
    name: "SPARCS Hospital Data",
    tag: "Health Data NY",
    tagColor: "#5b9cf5",
    desc: "Hospital discharge records — ER visit causes by zip, age, diagnosis.",
  },
  {
    name: "NYC HANES (2013–14)",
    tag: "SAS · NYU Langone",
    tagColor: "#a78bfa",
    desc: "Blood biomarkers for ~3,500 NYC adults. Last conducted 2013–14 — data gap.",
  },
  {
    name: "NHANES (National)",
    tag: "CDC · Ongoing",
    tagColor: "#a78bfa",
    desc: "58+ nutrient biomarkers by race/age/sex. National sample, not NYC-specific.",
  },
];

export default function SourcesPage() {
  return (
    <SectionShell
      icon="📡"
      title="All Data Sources & APIs"
      description="16 sources · All free, public, API-accessible or downloadable"
      accentColor="rgba(244,114,182,.12)"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sources.map((s) => (
          <div
            key={s.name}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <h4 className="text-[13px] font-bold mb-1">{s.name}</h4>
            <div
              className="text-[10px] font-bold tracking-wide uppercase mb-1.5"
              style={{ color: s.tagColor }}
            >
              {s.tag}
            </div>
            <p className="text-[11px] text-dim leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

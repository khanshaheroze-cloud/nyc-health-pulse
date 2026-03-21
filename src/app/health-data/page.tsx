import type { Metadata } from "next";
import Link from "next/link";
import { SectionShell } from "@/components/SectionShell";

export const metadata: Metadata = {
  title: "Health Data — Disease, Demographics & More",
  description: "Explore NYC health data: COVID-19, flu surveillance, chronic disease, maternal health, overdose tracking, demographics, environment, and nutrition data.",
};

const sections = [
  { href: "/covid", icon: "🦠", title: "COVID-19", desc: "Hospitalizations, cases by borough, wastewater surveillance" },
  { href: "/flu", icon: "🤒", title: "Flu / ILI", desc: "Influenza-like illness rates, seasonal trends, wastewater tracking" },
  { href: "/chronic-disease", icon: "💊", title: "Chronic Disease", desc: "Obesity, diabetes, asthma, hypertension, mental health by borough" },
  { href: "/maternal-health", icon: "🤰", title: "Maternal Health", desc: "Maternal mortality, C-section rates, infant mortality by race" },
  { href: "/overdose", icon: "⚠️", title: "Overdose & Lead", desc: "Overdose deaths, naloxone access, childhood lead poisoning" },
  { href: "/demographics", icon: "📊", title: "Demographics", desc: "Race, poverty, income, uninsured rates from Census ACS" },
  { href: "/environment", icon: "🐀", title: "Environment", desc: "Rodent activity, water quality, noise, beach water, Citi Bike" },
  { href: "/nutrition", icon: "🥗", title: "Nutrition", desc: "NHANES dietary data, sodium, sugar, fruit & vegetable intake" },
];

export default function HealthDataPage() {
  return (
    <SectionShell
      icon="📋"
      title="Health Data"
      description="All NYC health datasets in one place — disease surveillance, chronic conditions, demographics, and environmental health"
      accentColor="rgba(91,156,245,.12)"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sections.map(({ href, icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-surface border border-border rounded-xl p-4 hover:border-hp-blue/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h3 className="text-[13px] font-bold text-text group-hover:text-hp-blue transition-colors">{title}</h3>
            </div>
            <p className="text-[11px] text-dim leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Free NYC Health Resources — Clinics, Hotlines & Assistance",
  description: "Free and low-cost health resources for NYC residents. Clinics, mental health hotlines, poison control, food assistance, cooling centers, and more.",
};
import { SectionShell } from "@/components/SectionShell";

const RESOURCES = [
  {
    category: "Emergency & Crisis",
    items: [
      { name: "911", desc: "Medical emergencies, fire, crime in progress", contact: "Call 911", url: null },
      { name: "988 Suicide & Crisis Lifeline", desc: "Free 24/7 crisis support — call or text", contact: "Call or text 988", url: "https://988lifeline.org" },
      { name: "Poison Control", desc: "Suspected poisoning — available 24/7", contact: "1-800-222-1222", url: "https://www.poison.org" },
    ],
  },
  {
    category: "Mental Health",
    items: [
      { name: "NYC Well", desc: "Free, confidential mental health support — call, text, or chat 24/7", contact: "888-NYC-WELL (888-692-9355) or text WELL to 65173", url: "https://nyc.gov/nycwell" },
      { name: "Crisis Text Line", desc: "Text-based crisis support", contact: "Text HELLO to 741741", url: "https://www.crisistextline.org" },
    ],
  },
  {
    category: "Healthcare Access",
    items: [
      { name: "NYC Health + Hospitals", desc: "Free or sliding-scale primary care at 70+ locations — no insurance required", contact: "844-NYC-4NYC (844-692-4692)", url: "https://www.nychealthandhospitals.org" },
      { name: "NYC Care", desc: "Guaranteed low-cost health services for uninsured NYC residents", contact: "646-NYC-CARE (646-692-2273)", url: "https://www.nyccare.nyc" },
      { name: "Free flu shots", desc: "Find free or low-cost flu vaccines near you", contact: null, url: "https://vaccinefinder.nyc.gov" },
    ],
  },
  {
    category: "Substance Use & Harm Reduction",
    items: [
      { name: "Free naloxone (Narcan)", desc: "Available at any NYC pharmacy without a prescription — can reverse opioid overdose", contact: "Ask any pharmacist", url: "https://www1.nyc.gov/site/doh/health/health-topics/naloxone.page" },
      { name: "NYC drug use resources", desc: "Syringe services, safe consumption info, and treatment referrals", contact: null, url: "https://www1.nyc.gov/site/doh/health/health-topics/alcohol-and-drug-use.page" },
    ],
  },
  {
    category: "Reporting & City Services",
    items: [
      { name: "311", desc: "Report rats, noise, unsafe conditions, broken streetlights, and more", contact: "Call 311 or use the 311 app", url: "https://portal.311.nyc.gov" },
      { name: "Restaurant inspection lookup", desc: "Search any restaurant's letter grade and inspection history", contact: null, url: "https://a816-dohbesp.nyc.gov/IndicatorPublic/Closures/" },
    ],
  },
  {
    category: "Food & Housing Assistance",
    items: [
      { name: "ACCESS NYC", desc: "Apply for SNAP, Medicaid, housing, cash assistance, and 30+ other programs", contact: null, url: "https://access.nyc.gov" },
      { name: "GetFood NYC", desc: "Free meals — no ID, registration, or documentation required", contact: null, url: "https://www.nyc.gov/site/hra/help/food-assistance.page" },
    ],
  },
  {
    category: "Extreme Weather",
    items: [
      { name: "NYC Cooling Centers", desc: "Free air-conditioned public spaces during heat emergencies", contact: "Call 311 for locations", url: "https://www.nyc.gov/beattheheat" },
      { name: "NYC Warming Centers", desc: "Heated shelters during extreme cold", contact: "Call 311 for locations", url: null },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <SectionShell
      icon="🏥"
      title="NYC Health Resources"
      description="Free and low-cost health services, hotlines, and assistance programs for NYC residents"
      accentColor="rgba(16,185,129,.12)"
    >
      <div className="space-y-6">
        {RESOURCES.map((group) => (
          <div key={group.category}>
            <h3 className="text-[12px] font-bold tracking-[1.5px] uppercase text-dim mb-2">{group.category}</h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.name} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-[13px] font-bold">{item.name}</h4>
                    </div>
                    <p className="text-[12px] text-dim leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                    {item.contact && (
                      <span className="text-[11px] font-semibold text-hp-green bg-hp-green/10 border border-hp-green/20 px-2.5 py-1 rounded-lg">
                        {item.contact}
                      </span>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-hp-blue hover:underline"
                      >
                        Visit site →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted mt-6">
        All resources listed are free or sliding-scale for NYC residents. Information current as of March 2026.
        If you or someone you know is in immediate danger, call 911.
      </p>
    </SectionShell>
  );
}

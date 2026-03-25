"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface WellnessSpot {
  name: string;
  neighborhood: string;
  borough: string;
  priceRange: string;
  note: string;
  url?: string;
}

interface WellnessCategory {
  id: string;
  icon: string;
  label: string;
  description: string;
  healthBenefit: string;
  priceRange: string;
  freeOption?: string;
  spots: WellnessSpot[];
}

/* ------------------------------------------------------------------ */
/*  Curated wellness data                                               */
/* ------------------------------------------------------------------ */
const CATEGORIES: WellnessCategory[] = [
  {
    id: "cold",
    icon: "🧊",
    label: "Cold Plunge",
    description: "Cold water immersion (38-55°F) for 2-10 minutes. Growing evidence for mood, inflammation, and recovery.",
    healthBenefit: "Cold exposure triggers norepinephrine release, reducing inflammation and improving alertness. Studies show regular cold exposure may reduce symptoms of depression and anxiety. Also aids post-exercise recovery.",
    priceRange: "$15-50/session",
    spots: [
      { name: "Othership", neighborhood: "Williamsburg", borough: "Brooklyn", priceRange: "$40-60", note: "Breathwork + hot/cold circuits. Group sessions." },
      { name: "KOVE", neighborhood: "Lower East Side", borough: "Manhattan", priceRange: "$25-45", note: "Rooftop cold plunge with city views." },
      { name: "Recoverie", neighborhood: "Flatiron", borough: "Manhattan", priceRange: "$35-55", note: "Recovery studio with cold plunge, sauna, compression." },
      { name: "Remedy Place", neighborhood: "Flatiron", borough: "Manhattan", priceRange: "$45-75", note: "Social wellness club. Cold plunge + IV + hyperbaric." },
      { name: "Spa 88", neighborhood: "Flushing", borough: "Queens", priceRange: "$45 all-day", note: "Korean spa with cold plunge pool, sauna, and jjimjilbang." },
      { name: "Russian & Turkish Baths", neighborhood: "East Village", borough: "Manhattan", priceRange: "$45", note: "Since 1892. Cold plunge pool + Russian steam room." },
    ],
  },
  {
    id: "sauna",
    icon: "🔥",
    label: "Sauna & Heat",
    description: "Infrared sauna, traditional Finnish sauna, and steam rooms. 150-200°F for 15-30 minutes.",
    healthBenefit: "Regular sauna use (4-7x/week) associated with 40% lower all-cause mortality in Finnish studies. Improves cardiovascular function, lowers blood pressure, and may reduce dementia risk. Infrared penetrates deeper at lower temps.",
    priceRange: "$30-80/session",
    spots: [
      { name: "Archimedes Banya", neighborhood: "Coney Island", borough: "Brooklyn", priceRange: "$47 day pass", note: "Russian-style banya, co-ed. Russian steam room, Turkish hammam, Dead Sea salt room." },
      { name: "CityWell Brooklyn", neighborhood: "Carroll Gardens", borough: "Brooklyn", priceRange: "$55/session", note: "Korean-inspired. Infrared sauna, cold plunge, relaxation room." },
      { name: "Aire Ancient Baths", neighborhood: "Tribeca", borough: "Manhattan", priceRange: "$90+", note: "Luxury thermal baths. Candlelit underground space, multiple temperature pools." },
      { name: "Russian & Turkish Baths", neighborhood: "East Village", borough: "Manhattan", priceRange: "$52 day pass", note: "NYC institution since 1892. Platza oak-leaf treatment, Russian room, Turkish room." },
      { name: "Spa Castle", neighborhood: "College Point", borough: "Queens", priceRange: "$50 day pass", note: "Korean mega-spa. Multiple saunas, outdoor pool, rooftop." },
    ],
  },
  {
    id: "yoga",
    icon: "🧘",
    label: "Yoga",
    description: "Yoga studios and free outdoor classes across NYC. All levels welcome.",
    healthBenefit: "Consistent yoga practice reduces cortisol, improves flexibility and balance, and has strong evidence for reducing anxiety and depression. NYC's depression rate is 21% — yoga is one of the most accessible interventions.",
    priceRange: "$0-35/class",
    freeOption: "Shape Up NYC offers free yoga in parks. Bryant Park, Central Park, and Brooklyn Bridge Park have free summer classes.",
    spots: [
      { name: "Y7 Studio", neighborhood: "Multiple locations", borough: "Manhattan/Brooklyn", priceRange: "$30/class", note: "Hot yoga in candlelit rooms. Hip-hop soundtrack, heated to 80-90°F." },
      { name: "Yoga to the People", neighborhood: "St Marks Place", borough: "Manhattan", priceRange: "Donation $10-20", note: "Donation-based hot yoga. No frills, community vibe." },
      { name: "Sky Ting Yoga", neighborhood: "Tribeca & Chinatown", borough: "Manhattan", priceRange: "$30/class", note: "Modern Katonah/vinyasa. Minimalist studios, strong community." },
      { name: "Modo Yoga NYC", neighborhood: "Union Square", borough: "Manhattan", priceRange: "$25/class", note: "Hot yoga (Moksha tradition). Eco-friendly, heated to 100°F." },
      { name: "Bhakti Center", neighborhood: "East Village", borough: "Manhattan", priceRange: "$15-20/class", note: "Traditional yoga + kirtan. Spiritual focus, beginner-friendly." },
    ],
  },
  {
    id: "massage",
    icon: "💆",
    label: "Massage",
    description: "Licensed massage therapy — from clinical sports massage to relaxation. NYC has 10,000+ licensed LMTs.",
    healthBenefit: "Massage reduces muscle tension, improves circulation, and lowers cortisol. Regular massage is associated with reduced back pain, headaches, and anxiety. Choose licensed therapists (LMT) for safety.",
    priceRange: "$60-180/session",
    freeOption: "Some community acupuncture clinics offer discounted massage. Check Find Care for LMTs near you.",
    spots: [
      { name: "Juvenex Spa", neighborhood: "Koreatown", borough: "Manhattan", priceRange: "$90+/hr", note: "24-hour Korean spa. Open late, great for shift workers." },
      { name: "Chillhouse", neighborhood: "Lower East Side", borough: "Manhattan", priceRange: "$65/30min", note: "Modern 'chill' spa. Also nails, facials." },
      { name: "Haven Spa", neighborhood: "Mercer Street", borough: "Manhattan", priceRange: "$80/hr", note: "Affordable massage. No frills, clean, good therapists." },
      { name: "Great Jones Spa", neighborhood: "NoHo", borough: "Manhattan", priceRange: "$120/hr", note: "Full spa + water lounge. 3-story thermal area included with treatment." },
    ],
  },
  {
    id: "acupuncture",
    icon: "🪡",
    label: "Acupuncture",
    description: "Traditional Chinese medicine needle therapy. Growing evidence for pain, stress, and fertility support.",
    healthBenefit: "NIH-supported evidence for chronic pain, migraines, nausea, and osteoarthritis. Community acupuncture makes it affordable. Many insurance plans now cover acupuncture.",
    priceRange: "$20-150/session",
    spots: [
      { name: "WTHN", neighborhood: "Flatiron & Williamsburg", borough: "Manhattan/Brooklyn", priceRange: "$75/session", note: "Modern community acupuncture. Walk-ins welcome, beginner-friendly." },
      { name: "Ora Acupuncture", neighborhood: "Park Slope", borough: "Brooklyn", priceRange: "$40-80 sliding scale", note: "Community style. Treats pain, anxiety, fertility." },
      { name: "Chinatown Wellness Center", neighborhood: "Chinatown", borough: "Manhattan", priceRange: "$50-70/session", note: "Traditional Chinese medicine. Established practitioners." },
      { name: "City Acupuncture", neighborhood: "Multiple locations", borough: "Manhattan/Brooklyn", priceRange: "$40-75", note: "Affordable community model. Treats stress, pain, insomnia." },
    ],
  },
  {
    id: "pools",
    icon: "🏊",
    label: "Public Pools",
    description: "NYC Parks operates 53 outdoor pools (summer) and 12 indoor pools (year-round). Essentially free.",
    healthBenefit: "Swimming is one of the best full-body, low-impact exercises. Improves cardiovascular health, builds muscle, and is accessible to all fitness levels. NYC's pools are one of the city's best-kept wellness secrets.",
    priceRange: "$0 (outdoor) / $25/yr membership (indoor)",
    freeOption: "All outdoor pools are free. Indoor pools require NYC Parks recreation center membership: $25/yr adults, free for seniors 62+ and youth under 18.",
    spots: [
      { name: "All 53 NYC Parks Outdoor Pools", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "FREE, open late June through Labor Day. No membership required." },
      { name: "Floating Pool at Barretto Point", neighborhood: "Hunts Point", borough: "Bronx", priceRange: "Free", note: "Seasonal, FREE. Unique floating barge pool." },
      { name: "McCarren Park Pool", neighborhood: "Williamsburg", borough: "Brooklyn", priceRange: "Free", note: "Olympic-sized, FREE summer. Recently renovated." },
      { name: "Hamilton Fish Pool", neighborhood: "Lower East Side", borough: "Manhattan", priceRange: "Free", note: "Indoor + outdoor, FREE. Year-round indoor pool." },
      { name: "Astoria Pool", neighborhood: "Astoria", borough: "Queens", priceRange: "Free", note: "Olympic-sized (1936 Olympics trial site), FREE summer." },
    ],
  },
  {
    id: "mental",
    icon: "🧠",
    label: "Mental Health",
    description: "Crisis lines, free counseling, and mental health resources across NYC.",
    healthBenefit: "1 in 5 NYC adults report depression symptoms. Early intervention improves outcomes dramatically. NYC has extensive free and low-cost mental health infrastructure.",
    priceRange: "Free – sliding scale",
    freeOption: "NYC Well (888-NYC-WELL) provides free, confidential crisis counseling 24/7. 988 Suicide & Crisis Lifeline is always available.",
    spots: [
      { name: "NYC Well", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "FREE 24/7 hotline: 888-NYC-WELL. Call, text, or chat. Counseling, crisis support, referrals." },
      { name: "ThriveNYC Community Centers", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "FREE walk-in support at Community Health Centers citywide." },
      { name: "Open Path Collective", neighborhood: "Telehealth", borough: "All boroughs", priceRange: "$30-80/session", note: "Therapy at reduced rates for those without insurance. Online directory." },
      { name: "NYC DOHMH Mental Health Service Corps", neighborhood: "Underserved neighborhoods", borough: "All boroughs", priceRange: "Free", note: "FREE or low-cost therapy in underserved neighborhoods." },
    ],
  },
  {
    id: "fitness",
    icon: "💪",
    label: "Free Fitness",
    description: "Free outdoor workout classes, fitness equipment parks, and group exercise across NYC.",
    healthBenefit: "150 minutes of moderate exercise per week reduces cardiovascular disease risk by 35%, reduces depression and anxiety, and improves sleep. NYC offers more free fitness options than any other US city.",
    priceRange: "Free",
    freeOption: "All options below are free!",
    spots: [
      { name: "NYC Parks GreenThumb", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "FREE community garden volunteering (counts as exercise!)." },
      { name: "Central Park Track Club", neighborhood: "Central Park", borough: "Manhattan", priceRange: "Free", note: "FREE group runs, Saturdays 9am. All paces." },
      { name: "November Project NYC", neighborhood: "Varies", borough: "Manhattan", priceRange: "Free", note: "FREE outdoor bootcamp, Wed 6:30am & Fri 6:30am. Stairs at various locations." },
      { name: "The Movement Creative", neighborhood: "Parks citywide", borough: "All boroughs", priceRange: "Free", note: "FREE dance + movement classes in parks, summer. All ages." },
      { name: "Shape Up NYC", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "FREE fitness classes at Parks Dept locations citywide. Yoga, Zumba, boot camp." },
    ],
  },
  {
    id: "spa",
    icon: "🧖",
    label: "Spas",
    description: "Day spas, Korean bathhouses, and luxury thermal circuits. Full-body relaxation and detox experiences.",
    healthBenefit: "Spa treatments combine heat therapy, hydrotherapy, and relaxation to reduce cortisol, improve circulation, and promote deep relaxation. Regular spa visits are associated with lower stress, better sleep, and reduced muscle tension. Korean/Russian bathhouses offer multi-hour experiences with multiple heat and cold cycles.",
    priceRange: "$40-200+",
    spots: [
      { name: "QC NY Spa", neighborhood: "Governors Island", borough: "Manhattan", priceRange: "$88 day pass", note: "Thermal baths with NYC skyline views. Seasonal April-October." },
      { name: "SoJo Spa Club", neighborhood: "Edgewater NJ (shuttle from Port Authority)", borough: "NJ", priceRange: "$65 weekday", note: "Korean mega-spa. Multiple pools, saunas." },
      { name: "AIRE Ancient Baths", neighborhood: "Tribeca", borough: "Manhattan", priceRange: "$90+", note: "Roman-style thermal baths. Underground candlelit space." },
      { name: "Bathhouse", neighborhood: "Williamsburg", borough: "Brooklyn", priceRange: "$62 day pass", note: "Social bathhouse + spa. Hot pool, cold plunge, steam, sauna, roof deck." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function WellnessDirectory() {
  const [activeCategory, setActiveCategory] = useState<string>("cold");

  const category = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Category tabs — horizontally scrollable */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
              activeCategory === cat.id
                ? "bg-hp-purple/10 text-hp-purple border-hp-purple/20"
                : "text-dim border-border hover:text-text hover:bg-bg"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Category detail */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl">{category.icon}</span>
          <div>
            <h3 className="text-[14px] font-bold text-text">{category.label}</h3>
            <p className="text-[11px] text-dim mt-0.5">{category.description}</p>
          </div>
        </div>

        {/* Health benefit callout */}
        <div className="bg-hp-green/5 border border-hp-green/15 rounded-lg p-3 mb-3">
          <p className="text-[10px] font-semibold text-hp-green mb-0.5">Health Benefit</p>
          <p className="text-[10px] text-dim leading-relaxed">{category.healthBenefit}</p>
        </div>

        {/* Price + free options */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-hp-orange/10 text-hp-orange border border-hp-orange/20">
            {category.priceRange}
          </span>
          {category.freeOption && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-hp-green/10 text-hp-green border border-hp-green/20">
              Free options available
            </span>
          )}
        </div>

        {category.freeOption && (
          <p className="text-[10px] text-hp-green bg-hp-green/5 rounded-lg px-3 py-2 mb-3 leading-relaxed">
            <strong>Free:</strong> {category.freeOption}
          </p>
        )}
      </div>

      {/* Spots list */}
      <div className="space-y-1.5">
        {category.spots.map((spot) => (
          <div key={spot.name} className="flex items-start gap-3 border border-border rounded-lg px-3 py-2.5 hover:bg-bg/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[11px] font-bold text-text">{spot.name}</p>
                {spot.priceRange === "Free" && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green">FREE</span>
                )}
              </div>
              <p className="text-[9px] text-muted">{spot.neighborhood}, {spot.borough}</p>
              <p className="text-[10px] text-dim mt-0.5 leading-relaxed">{spot.note}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] font-display font-bold text-text">{spot.priceRange}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Find Care link for licensed providers */}
      {(category.id === "massage" || category.id === "acupuncture") && (
        <div className="mt-3 p-3 bg-hp-blue/5 border border-hp-blue/15 rounded-lg">
          <p className="text-[10px] text-dim mb-1.5">
            Looking for a licensed {category.label.toLowerCase()} provider near you?
          </p>
          <Link
            href="/find-care"
            className="text-[10px] font-semibold text-hp-blue hover:underline"
          >
            Search Find Care →
          </Link>
        </div>
      )}

      <p className="text-[9px] text-muted mt-3 text-center">
        Listings are editorially curated · prices are approximate and may change · updated quarterly
      </p>
    </div>
  );
}

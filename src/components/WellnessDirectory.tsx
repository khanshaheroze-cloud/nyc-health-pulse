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
      { name: "HigherDOSE", neighborhood: "Flatiron", borough: "Manhattan", priceRange: "$55-75", note: "Infrared sauna with chromotherapy. Flagship." },
      { name: "Chill Space", neighborhood: "Greenpoint", borough: "Brooklyn", priceRange: "$40-55", note: "Infrared sauna suites. Couples available." },
      { name: "Archimedes Banya", neighborhood: "Sheepshead Bay", borough: "Brooklyn", priceRange: "$50 all-day", note: "Russian-style bathhouse with platza treatment." },
      { name: "Aire Ancient Baths", neighborhood: "Tribeca", borough: "Manhattan", priceRange: "$90-180", note: "Luxury thermal circuit. Splurge option." },
      { name: "World Spa", neighborhood: "Midwood", borough: "Brooklyn", priceRange: "$55 all-day", note: "Korean spa. Multiple sauna rooms, pools, lounge." },
      { name: "SoJo Spa Club", neighborhood: "Edgewater", borough: "NJ (20 min from NYC)", priceRange: "$65", note: "Massive thermal circuit with outdoor pools. Worth the trip." },
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
      { name: "Shape Up NYC (Free)", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "NYC Parks free outdoor yoga, boot camp, Zumba. No registration." },
      { name: "Bryant Park Yoga (Free)", neighborhood: "Midtown", borough: "Manhattan", priceRange: "Free", note: "Summer Tuesdays and Thursdays at 10am. All levels." },
      { name: "Modo Yoga", neighborhood: "Multiple locations", borough: "Manhattan/Brooklyn", priceRange: "$25-30/class", note: "Hot yoga in eco-friendly heated studios." },
      { name: "SKY TING Yoga", neighborhood: "Chinatown/Williamsburg", borough: "Manhattan/Brooklyn", priceRange: "$30/class", note: "Modern vinyasa and meditation. Community-focused." },
      { name: "Yoga to the People", neighborhood: "Multiple locations", borough: "Manhattan/Brooklyn", priceRange: "Donation-based", note: "Hot vinyasa. Suggested $10-15 donation." },
      { name: "Y7 Studio", neighborhood: "Multiple locations", borough: "Manhattan/Brooklyn", priceRange: "$28-35/class", note: "Heated vinyasa in candlelit rooms with hip-hop music." },
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
      { name: "Zeel (On-demand)", neighborhood: "Citywide", borough: "All boroughs", priceRange: "$130-180", note: "Licensed therapist comes to you. Book same-day." },
      { name: "Squeeze Massage", neighborhood: "Multiple locations", borough: "Manhattan", priceRange: "$70-120", note: "Fixed pricing, no tipping. Walk-ins welcome." },
      { name: "Chinatown massage studios", neighborhood: "Chinatown", borough: "Manhattan", priceRange: "$40-60/hr", note: "Foot reflexology and body massage at budget prices." },
      { name: "Body by Brooklyn", neighborhood: "Park Slope", borough: "Brooklyn", priceRange: "$100-140", note: "Sports massage and deep tissue specialists." },
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
      { name: "WTHN", neighborhood: "Flatiron/FiDi", borough: "Manhattan", priceRange: "$75-95", note: "Modern acupuncture studio. Walk-ins welcome. Ear seeds available." },
      { name: "People's Organization of Community Acupuncture (POCA)", neighborhood: "Multiple", borough: "All boroughs", priceRange: "$20-40 sliding scale", note: "Community acupuncture — group setting, affordable." },
      { name: "Chinatown acupuncture clinics", neighborhood: "Chinatown", borough: "Manhattan", priceRange: "$30-60", note: "Traditional TCM clinics. Often include herbal consultation." },
      { name: "Brooklyn Acupuncture Project", neighborhood: "Park Slope", borough: "Brooklyn", priceRange: "$25-45 sliding scale", note: "Community model. No one turned away for inability to pay." },
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
      { name: "McCarren Park Pool", neighborhood: "Williamsburg", borough: "Brooklyn", priceRange: "Free (summer)", note: "One of NYC's largest public pools. Olympic-size. Open June–Sept." },
      { name: "Hamilton Fish Pool", neighborhood: "Lower East Side", borough: "Manhattan", priceRange: "Free (summer)", note: "Outdoor pool with separate kids pool. Historic facility." },
      { name: "Astoria Pool", neighborhood: "Astoria", borough: "Queens", priceRange: "Free (summer)", note: "Largest public pool in NYC. Built for 1936 Olympics." },
      { name: "Crotona Pool", neighborhood: "Crotona Park", borough: "Bronx", priceRange: "Free (summer)", note: "Large outdoor pool with adjacent playground and rec center." },
      { name: "Tottenville Pool", neighborhood: "Tottenville", borough: "Staten Island", priceRange: "Free (summer)", note: "Neighborhood pool near the southern tip of NYC." },
      { name: "Tony Dapolito Recreation Center", neighborhood: "West Village", borough: "Manhattan", priceRange: "$25/yr", note: "Indoor pool open year-round. One of the nicest in Manhattan." },
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
      { name: "NYC Well", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "Call 888-NYC-WELL, text WELL to 65173, or chat online. 24/7. 200+ languages." },
      { name: "988 Suicide & Crisis Lifeline", neighborhood: "National", borough: "All boroughs", priceRange: "Free", note: "Call or text 988. 24/7 crisis support." },
      { name: "NYC H+H Behavioral Health", neighborhood: "11 hospitals", borough: "All boroughs", priceRange: "Sliding scale", note: "Public hospital system. No one turned away for inability to pay." },
      { name: "Open Path Collective", neighborhood: "Telehealth", borough: "All boroughs", priceRange: "$30-80/session", note: "Affordable therapy network. Licensed therapists at reduced rates." },
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
      { name: "Shape Up NYC", neighborhood: "Citywide", borough: "All boroughs", priceRange: "Free", note: "100+ free weekly classes: yoga, boot camp, Zumba, Pilates, cycling. No registration." },
      { name: "November Project NYC", neighborhood: "Varies", borough: "Manhattan", priceRange: "Free", note: "Free bootcamp community. Wed stairs, Fri workout. Just show up." },
      { name: "Outdoor Fitness Equipment", neighborhood: "100+ parks", borough: "All boroughs", priceRange: "Free", note: "Pull-up bars, parallel bars, and fitness equipment in parks citywide." },
      { name: "NYC Parks Running Track", neighborhood: "Multiple parks", borough: "All boroughs", priceRange: "Free", note: "Rubberized tracks at McCarren Park, Red Hook, Icahn Stadium, and more." },
      { name: "Central Park Track Club", neighborhood: "Central Park", borough: "Manhattan", priceRange: "Free", note: "Free group runs multiple days per week. All paces welcome." },
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

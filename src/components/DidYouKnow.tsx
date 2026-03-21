const FACTS = [
  "The Upper East Side and Hunts Point are 7 miles apart — and 13 years of life expectancy apart.",
  "NYC tap water is tested 1,000+ times per month and consistently passes all federal standards.",
  "Fentanyl is involved in ~80% of NYC overdose deaths. Free Narcan is available at any pharmacy without a prescription.",
  "Construction noise is the #1 type of 311 noise complaint in NYC.",
  "Only 10% of NYC adults eat the recommended 5+ daily servings of fruits and vegetables.",
  "The Bronx has the highest asthma ED visit rate in NYC — nearly 4× higher than Manhattan's Upper East Side.",
  "NYC's rat population is estimated at around 3 million — roughly one for every 3 residents.",
  "68% of NYC restaurants received an A grade at their most recent health inspection.",
  "COVID wastewater surveillance can detect outbreaks 4-7 days before clinical testing data shows them.",
  "Manhattan has the best air quality in NYC (lowest PM2.5), largely due to fewer highways and industrial sources.",
  "The average EMS response time in NYC is about 7 minutes — but varies by over 2 minutes between boroughs.",
  "Diabetes rates in East Harlem are nearly 3× higher than on the Upper West Side.",
  "NYC's Citi Bike system has over 2,000 stations and 30,000+ bikes — one of the largest bike-share systems in the world.",
  "Beach water quality at Coney Island has exceeded EPA enterococci limits multiple times in recent summers.",
  "Staten Island has the lowest population density but one of the highest rates of opioid overdose deaths per capita.",
  "NYC added over 50 miles of protected bike lanes between 2020-2024 as part of Vision Zero.",
  "Lead paint remains a major hazard — over 5,000 NYC children under 6 still test above the elevated blood lead threshold annually.",
  "Queens is the most ethnically diverse urban area in the world, with over 130 languages spoken.",
  "NYC's drinking water travels up to 125 miles from reservoirs in the Catskill Mountains — unfiltered, thanks to watershed protection.",
  "Heat is the deadliest weather event in NYC. During major heat waves, excess deaths can exceed 100 in a single week.",
];

export function DidYouKnow() {
  const fact = FACTS[Math.floor(Math.random() * FACTS.length)];

  return (
    <div className="border-l-2 border-hp-green/40 bg-hp-green/5 rounded-r-lg px-3 py-2">
      <p className="text-[11px] text-dim">
        💡 <span className="font-medium">Did you know?</span> {fact}
      </p>
    </div>
  );
}

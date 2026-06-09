import TrackerApp from "@/components/nutrition-tracker/TrackerApp";

// Server-rendered shell: heading, description, and explainer content are real
// HTML for crawlers and no-JS users; the interactive tracker hydrates inside.
export default function NutritionTrackerPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[28px] sm:text-[34px] text-text">Nutrition Tracker</h1>
        <p className="text-sm text-dim mt-1">
          Track meals &middot; 500K+ foods &middot; NYC&apos;s curated database
        </p>
      </div>

      <TrackerApp />

      {/* Static explainer — server-rendered so the page is never just "Loading tracker..." */}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-[20px] text-text mb-3">How the tracker works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] text-dim leading-relaxed">
          <div>
            <h3 className="font-semibold text-text mb-1">Log anything you eat in NYC</h3>
            <p>
              Search 500K+ foods from USDA and Open Food Facts, plus our curated NYC database —
              halal carts, bodega sandwiches, dollar-slice pizza, and the menus of 30+ local chains.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-1">Targets that fit your body</h3>
            <p>
              Set your profile once and we calculate daily calorie and macro targets automatically,
              or set manual goals. Water intake and micronutrients are tracked alongside macros.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-1">See your week at a glance</h3>
            <p>
              Weekly trends show calories, protein, and weight direction. Sign in to sync your log
              and goals across devices; without an account everything stays on this device.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-6">
          Nutrition data is informational, not medical advice. Restaurant nutrition values are
          estimates and can vary ±15% by location and preparation.
        </p>
      </section>
    </>
  );
}

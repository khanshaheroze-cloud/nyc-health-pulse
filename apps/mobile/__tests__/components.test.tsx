/* Component honesty rules: chip tones render, a Places bodega never shows a
 * fake grade, a DOHMH venue shows its real one, est. labels appear.
 * (@testing-library/react-native v14 — use render's queries, no `screen`.) */
import { render } from "@testing-library/react-native";
import { Chip } from "../components/ui/Chip";
import { VenueCard } from "../components/eat-smart/VenueCard";
import type { ApiRestaurant } from "../lib/types";

function venue(over: Partial<ApiRestaurant>): ApiRestaurant {
  return {
    restaurantId: "v1",
    slug: "generic-bodega",
    restaurantName: "Millie's Deli & Grocery",
    cuisine: "Deli / Bodega",
    priceRange: 1,
    priceTier: "$",
    distance: 102,
    walkMinutes: 1,
    lat: 40.744,
    lng: -73.949,
    address: "13-01 Jackson Ave",
    grade: "",
    inspectedAt: null,
    isGeneric: true,
    category: "Bodega",
    topPicks: [
      { id: "p", name: "Turkey & Swiss on Wheat", calories: 420, protein: 28, carbs: 0, fat: 0, fiber: 0, pulseScore: 65, estPrice: 7 },
    ],
    bestDrink: null,
    locationCount: 1,
    otherLocations: [],
    camis: null,
    categoryChip: { label: "Deli / Bodega", icon: "🥪" },
    openState: "open",
    hoursSource: "google",
    hoursChip: { label: "Open now", tone: "open" },
    source: "places",
    ...over,
  };
}

describe("Chip", () => {
  test.each([
    ["grade", "Grade A"],
    ["nys", "NYS retail food store"],
    ["hours-closed", "Closed · opens 7am"],
    ["fits", "✓ Fits your day — 1,200 cal left"],
    ["verified", "✓ Menu verified"],
  ] as const)("tone %s renders its label", async (tone, label) => {
    const { getByText } = await render(<Chip tone={tone} label={label} />);
    expect(getByText(label)).toBeTruthy();
  });
});

describe("VenueCard honesty rules", () => {
  test("Places bodega: NYS chip, never a letter grade", async () => {
    const { getByText, queryByText } = await render(<VenueCard venue={venue({})} onPress={() => {}} />);
    expect(getByText("NYS retail food store")).toBeTruthy();
    expect(queryByText(/Grade [A-C]/)).toBeNull();
  });

  test("DOHMH venue shows its real grade", async () => {
    const { getByText, queryByText } = await render(
      <VenueCard venue={venue({ grade: "A", source: "dohmh", camis: "50103653" })} onPress={() => {}} />,
    );
    expect(getByText("Grade A")).toBeTruthy();
    expect(queryByText("NYS retail food store")).toBeNull();
  });

  test("generic venues carry the est. qualifier and ~calorie prefix", async () => {
    const { getByText } = await render(<VenueCard venue={venue({})} onPress={() => {}} />);
    expect(getByText("~420 cal")).toBeTruthy();
    expect(getByText(/est\./)).toBeTruthy();
  });

  test("fits-your-day chip renders only when the pick fits", async () => {
    const fits = await render(<VenueCard venue={venue({})} onPress={() => {}} fitsCalLeft={1000} />);
    expect(fits.getByText(/Fits your day/)).toBeTruthy();
    const noFit = await render(<VenueCard venue={venue({})} onPress={() => {}} fitsCalLeft={100} />);
    expect(noFit.queryByText(/Fits your day/)).toBeNull();
  });

  test("guidance venues render tips, never a phantom order", async () => {
    const { getByText, queryByText } = await render(
      <VenueCard venue={venue({ topPicks: [], orderingTip: "Ask for it on whole wheat." })} onPress={() => {}} />,
    );
    expect(getByText(/Smart ordering tips/)).toBeTruthy();
    expect(queryByText(/^Order:/)).toBeNull();
  });
});

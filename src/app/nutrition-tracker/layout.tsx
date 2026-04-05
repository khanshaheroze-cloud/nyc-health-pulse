import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nutrition Tracker",
  description:
    "Track your daily meals with NYC's largest curated food database — halal carts, bodegas, local chains & more.",
};

export default function NutritionTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

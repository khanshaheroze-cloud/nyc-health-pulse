import type { Metadata } from "next";
import { WorkoutTrackerRedesign } from "@/components/workout-tracker/WorkoutTrackerRedesign";
import { WorkoutErrorBoundary } from "@/components/workout-tracker/WorkoutErrorBoundary";

export const metadata: Metadata = {
  title: "Workouts",
  description:
    "Plan your weekly routine, log workouts, track PRs, and view your training calendar. 500+ exercises across strength, cardio, yoga, and more.",
};

export default function WorkoutsPage() {
  return (
    <section className="max-w-2xl mx-auto">
      <WorkoutErrorBoundary>
        <WorkoutTrackerRedesign />
      </WorkoutErrorBoundary>
    </section>
  );
}

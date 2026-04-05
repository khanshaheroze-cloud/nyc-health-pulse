import type { Metadata } from "next";
import { WorkoutTracker } from "@/components/workout-tracker/WorkoutTracker";
import { WorkoutErrorBoundary } from "@/components/workout-tracker/WorkoutErrorBoundary";

export const metadata: Metadata = {
  title: "Workouts",
  description:
    "Plan your weekly routine, log workouts, track PRs, and view your training calendar. 500+ exercises across strength, cardio, yoga, and more.",
};

export default function WorkoutsPage() {
  return (
    <section className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">🏋️</span>
        <h1 className="font-display text-2xl text-text font-bold">Workouts</h1>
      </div>
      <WorkoutErrorBoundary>
        <WorkoutTracker />
      </WorkoutErrorBoundary>
    </section>
  );
}

import type { Metadata } from "next";
import { WorkoutTracker } from "@/components/workout-tracker/WorkoutTracker";

export const metadata: Metadata = {
  title: "Workout Tracker — Pulse NYC",
  description:
    "Log workouts, track PRs, plan your training week. Strength, cardio, yoga, pilates & more.",
};

export default function WorkoutTrackerPage() {
  return (
    <section>
      <WorkoutTracker />
    </section>
  );
}

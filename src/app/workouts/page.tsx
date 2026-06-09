import type { Metadata } from "next";
import { WorkoutTrackerRedesign } from "@/components/workout-tracker/WorkoutTrackerRedesign";
import { WorkoutErrorBoundary } from "@/components/workout-tracker/WorkoutErrorBoundary";

export const metadata: Metadata = {
  title: "Workouts",
  description:
    "Plan your weekly routine, log workouts, track PRs, and view your training calendar. 500+ exercises across strength, cardio, yoga, and more.",
  alternates: { canonical: "/workouts" },
  openGraph: {
    title: "Workouts",
    description:
      "Plan your weekly routine, log workouts, track PRs, and view your training calendar. 500+ exercises across strength, cardio, yoga, and more.",
    url: "/workouts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workouts",
    description:
      "Plan your weekly routine, log workouts, track PRs, and view your training calendar. 500+ exercises across strength, cardio, yoga, and more.",
  },
};

// Server-rendered shell: the h1 and explainer are real HTML for crawlers;
// the interactive tracker (whose title bar is a styled <p>) hydrates inside.
export default function WorkoutsPage() {
  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="sr-only">Workouts — plan, log, and track your training</h1>
      <WorkoutErrorBoundary>
        <WorkoutTrackerRedesign />
      </WorkoutErrorBoundary>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-[20px] text-text mb-3">What the workout tracker does</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] text-dim leading-relaxed">
          <div>
            <h3 className="font-semibold text-text mb-1">500+ exercise library</h3>
            <p>
              Strength, cardio, yoga, mobility, and bodyweight movements with sets, reps, weight,
              and duration logging — or build reusable routines and start a session in one tap.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-1">PRs and streaks</h3>
            <p>
              Personal records are detected automatically as you log. Daily streaks and a training
              calendar keep your week honest.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text mb-1">Built for NYC life</h3>
            <p>
              Pair it with Run Routes for outdoor cardio scored by live air quality, and the
              Nutrition Tracker to close the loop on training days.
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-6">
          Your workout log stays on this device unless you sign in to sync. Not medical advice —
          consult a professional before starting a new training program.
        </p>
      </div>
    </section>
  );
}

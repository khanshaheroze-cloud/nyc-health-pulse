"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class WorkoutErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
          <p className="text-2xl">⚠️</p>
          <h2 className="text-[15px] font-bold text-text">Workout tracker hit an error</h2>
          <p className="text-[12px] text-dim">
            This may be caused by corrupted saved data. Try clearing your workout data to fix it.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                const keys = ["pulsenyc_workout_settings", "pulsenyc_workout_templates", "pulsenyc_workout_week",
                  "pulsenyc_workout_log", "pulsenyc_workout_prs", "pulsenyc_workout_favorites",
                  "pulsenyc_workout_recent_exercises", "pulsenyc_workout_active", "pulsenyc_workout_today_override"];
                keys.forEach(k => { try { localStorage.removeItem(k); } catch { /* */ } });
                this.setState({ hasError: false });
              }}
              className="px-4 py-2 bg-hp-red/10 text-hp-red text-[12px] font-semibold rounded-xl hover:bg-hp-red/20 transition-colors"
            >
              Clear Data & Retry
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-surface-sage text-dim text-[12px] font-semibold rounded-xl hover:bg-border transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

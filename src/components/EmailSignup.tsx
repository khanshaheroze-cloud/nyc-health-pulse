"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";
type Frequency = "weekly" | "daily";

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
      } else {
        setErrMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[14px] font-bold">Health Digest</span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-dim bg-surface border-border flex-shrink-0">
          FREE
        </span>
      </div>
      <p className="text-[12px] text-dim mb-3">
        Top NYC health metrics + news headlines — delivered to your inbox.
      </p>

      {status === "success" ? (
        <div className="flex items-center gap-2 text-hp-green text-[13px] font-semibold">
          <span>✓</span>
          <span>Subscribed! First {frequency} digest arrives {frequency === "weekly" ? "Monday" : "tomorrow"}.</span>
        </div>
      ) : (
        <>
          {/* Frequency toggle */}
          <div className="flex gap-1 mb-3 p-0.5 bg-bg border border-border rounded-lg w-fit">
            {(["weekly", "daily"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  frequency === f
                    ? "bg-hp-green/15 text-hp-green border border-hp-green/25"
                    : "text-dim hover:text-text border border-transparent"
                }`}
              >
                {f === "weekly" ? "Weekly" : "Daily"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-muted outline-none focus:border-hp-blue/50 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="px-4 py-2 bg-hp-green/15 border border-hp-green/30 text-hp-green text-[12px] font-semibold rounded-lg hover:bg-hp-green/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {status === "loading" ? "Subscribing…" : `Get ${frequency} digest`}
            </button>
          </form>
        </>
      )}

      {status === "error" && (
        <p className="text-[11px] text-hp-red mt-2">{errMsg}</p>
      )}

      <p className="text-[10px] text-muted mt-3">No spam · Unsubscribe anytime · Sent from pulsenyc.app</p>
    </div>
  );
}

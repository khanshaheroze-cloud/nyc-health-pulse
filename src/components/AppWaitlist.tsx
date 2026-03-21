"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function AppWaitlist() {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, source: "app-waitlist" }),
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
      <div className="flex items-start gap-3">
        {/* Phone icon */}
        <div className="w-10 h-10 rounded-xl bg-hp-blue/10 border border-hp-blue/20 flex items-center justify-center flex-shrink-0 text-lg">
          📱
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[14px] font-bold">Want Pulse NYC as a phone app?</h3>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-hp-blue bg-hp-blue/10 border-hp-blue/20 flex-shrink-0">
              COMING SOON
            </span>
          </div>
          <p className="text-[12px] text-dim mb-3">
            Drop your email and we&apos;ll notify you when the native app launches. Helps us gauge demand too.
          </p>

          {status === "success" ? (
            <div className="flex items-center gap-2 text-hp-green text-[13px] font-semibold">
              <span>✓</span>
              <span>You&apos;re on the list! We&apos;ll email you at launch.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === "loading"}
                className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-text placeholder:text-muted outline-none focus:border-hp-blue/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="px-4 py-2 bg-hp-blue/15 border border-hp-blue/30 text-hp-blue text-[12px] font-semibold rounded-lg hover:bg-hp-blue/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {status === "loading" ? "Joining…" : "Join waitlist"}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="text-[11px] text-hp-red mt-2">{errMsg}</p>
          )}

          <p className="text-[10px] text-muted mt-2">
            In the meantime, tap <strong>Share → Add to Home Screen</strong> for the instant PWA experience.
          </p>
        </div>
      </div>
    </div>
  );
}

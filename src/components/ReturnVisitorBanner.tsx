"use client";

import { useState, useEffect } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function ReturnVisitorBanner() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    try {
      // Increment visit count
      const count = parseInt(localStorage.getItem("pulse-visit-count") ?? "0", 10) + 1;
      localStorage.setItem("pulse-visit-count", String(count));

      // Only show for return visitors (2+) who haven't subscribed or dismissed
      if (
        count >= 2 &&
        !localStorage.getItem("pulse-subscribed") &&
        !localStorage.getItem("pulse-banner-dismissed")
      ) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem("pulse-banner-dismissed", "true");
    } catch {}
    setFadingOut(true);
    setTimeout(() => setVisible(false), 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency: "weekly" }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("success");
        try {
          localStorage.setItem("pulse-subscribed", "true");
        } catch {}
        // Fade out after showing confirmation
        setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => setVisible(false), 300);
        }, 2000);
      } else {
        setErrMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (!visible) return null;

  return (
    <div
      className={`bg-surface border border-border rounded-xl px-4 py-3 mb-6 transition-opacity duration-300 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Green accent bar */}
      <div className="absolute -mt-3 left-6 right-6 h-[2px] bg-hp-green/30 rounded-full pointer-events-none" />

      {status === "success" ? (
        <div className="flex items-center justify-center gap-2 text-hp-green text-[13px] font-semibold py-1">
          <span>&#10003;</span>
          <span>Subscribed! Your first weekly digest arrives Monday.</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Text */}
          <div className="flex-shrink-0">
            <p className="text-[13px] font-semibold text-text">
              Get NYC health updates in your inbox
            </p>
            <p className="text-[11px] text-dim">
              Free weekly digest &mdash; air quality, flu, COVID, and more
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 gap-2 min-w-0"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-3 py-1.5 text-[12px] text-text placeholder:text-muted outline-none focus:border-hp-green/50 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="px-3 py-1.5 bg-hp-green/15 border border-hp-green/30 text-hp-green text-[12px] font-semibold rounded-lg hover:bg-hp-green/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="self-start sm:self-center text-muted hover:text-text text-[16px] leading-none px-1 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {status === "error" && (
        <p className="text-[11px] text-hp-red mt-1">{errMsg}</p>
      )}
    </div>
  );
}

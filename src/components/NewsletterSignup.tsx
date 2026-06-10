"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

// Newsletter capture — distinct from the app waitlist (list: "newsletter").
// "One neighborhood food guide per week." Lives on guides and /eat-smart.
export function NewsletterSignup({ source }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency: "weekly", list: "newsletter", source }),
      });
      const data = await res.json();
      setStatus(res.ok && data.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-hp-green/8 border border-hp-green/25 rounded-2xl px-5 py-4 text-center">
        <p className="text-[14px] font-semibold text-hp-green">✓ You&apos;re in — one guide a week, no spam.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-[14px] font-bold text-text mb-1">One neighborhood food guide per week</p>
      <p className="text-[12px] text-dim mb-3">
        The next LIC. Exact orders, prices, macros — in your inbox before lunch on Friday.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor={`newsletter-email-${source ?? "x"}`} className="sr-only">Email for weekly food guide</label>
        <input
          id={`newsletter-email-${source ?? "x"}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={status === "loading"}
          className="flex-1 px-3 py-2 text-[13px] rounded-lg border border-border bg-bg text-text placeholder:text-muted outline-none focus:border-hp-green/50"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="px-4 py-2 rounded-lg bg-hp-green text-white text-[13px] font-semibold hover:bg-hp-green/90 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {status === "loading" ? "Saving…" : "Subscribe"}
        </button>
      </form>
      {status === "error" && <p className="text-[11px] text-hp-red mt-2">Couldn&apos;t subscribe — try again.</p>}
    </div>
  );
}

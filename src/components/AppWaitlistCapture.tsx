"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function AppWaitlistCapture() {
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
        body: JSON.stringify({ email, frequency: "weekly", list: "app_waitlist" }),
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

  if (status === "success") {
    return (
      <div className="max-w-[480px] mx-auto px-4">
        <div className="bg-white border border-[#E6E5DE] rounded-[14px] px-4 py-3 text-center">
          <span className="text-[#2F8F4D] text-[14px] font-semibold">&check; You&apos;re on the list! We&apos;ll email you at launch.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto px-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[#E6E5DE] rounded-[14px] py-1.5 pr-1.5 pl-4 flex items-center gap-2">
        <label htmlFor="waitlist-email" className="sr-only">Email for app waitlist</label>
        <input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email for the app waitlist"
          required
          disabled={status === "loading"}
          className="flex-1 border-none bg-transparent text-[14px] text-[#1A1A1A] placeholder:text-[#6B716B] outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="bg-[#1A1A1A] text-white text-[13px] font-medium px-4 py-2 rounded-full hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {status === "loading" ? "Saving…" : "Notify me at launch"}
        </button>
      </form>

      {status === "error" && (
        <p className="text-center text-[11px] text-[#C45A4A] mt-2">{errMsg}</p>
      )}

      <p className="text-center text-[11px] text-[#6B716B] mt-3">
        No spam &middot; No account &middot; ETA: Q3 2026
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";

interface Props {
  neighborhood: string;
  slug: string;
  borough: string;
  grade: string;
  score: number;
  rank: number;
  gradeColor: string;
  bestCategory: string;
  worstCategory: string;
}

export function ShareScoreCard({
  neighborhood,
  slug,
  borough,
  grade,
  score,
  rank,
  gradeColor,
  bestCategory,
  worstCategory,
}: Props) {
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `https://pulsenyc.app/neighborhood/${slug}`;
  const shareText = `${neighborhood}, ${borough} — Health Score: ${grade} (${score}/100) #${rank} of 42. Best: ${bestCategory}. pulsenyc.app`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${neighborhood} Health Score — Pulse NYC`, text: shareText, url });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    setShowCard(true);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = `${shareText}\n${url}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-dim bg-surface border border-border rounded-lg hover:border-accent/40 hover:text-accent transition-all"
        title="Share this neighborhood's score"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
        Share Score
      </button>

      {/* Modal overlay */}
      {showCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowCard(false)}
        >
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            {/* Shareable card — designed for screenshots */}
            <div
              className="rounded-2xl p-6 text-white shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${gradeColor}, ${gradeColor}cc)`,
              }}
            >
              <div className="flex items-center gap-2 mb-5 opacity-80">
                <span className="text-lg">💚</span>
                <span className="text-[12px] font-semibold tracking-wide uppercase">Pulse NYC</span>
              </div>

              <p className="text-white/70 text-[12px] mb-1">{borough}</p>
              <h3 className="font-display text-[22px] font-bold mb-5 leading-snug">{neighborhood}</h3>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-[28px] font-display font-bold">{grade}</span>
                </div>
                <div>
                  <p className="text-[22px] font-display font-bold">{score}/100</p>
                  <p className="text-white/70 text-[12px]">#{rank} of 42 neighborhoods</p>
                </div>
              </div>

              <div className="border-t border-white/20 pt-3 space-y-1">
                <p className="text-[12px]">
                  <span className="text-white/60">Best: </span>
                  <span className="font-semibold">{bestCategory}</span>
                </p>
                <p className="text-[12px]">
                  <span className="text-white/60">Needs work: </span>
                  <span className="font-semibold">{worstCategory}</span>
                </p>
              </div>

              <p className="text-white/40 text-[10px] mt-4">pulsenyc.app</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 bg-surface rounded-xl text-[13px] font-semibold text-text hover:bg-surface-sage/50 transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={() => setShowCard(false)}
                className="px-4 py-2.5 bg-white/10 rounded-xl text-[13px] text-white hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>

            <p className="text-center text-white/50 text-[10px] mt-3">
              Screenshot this card to share on social media
            </p>
          </div>
        </div>
      )}
    </>
  );
}

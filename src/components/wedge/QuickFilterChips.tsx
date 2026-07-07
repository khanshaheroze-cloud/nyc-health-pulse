"use client";

export type ChipId = "high-protein" | "quick" | "under-15" | "open-now";

// "Under $15" replaced the abstract $/$$/$$$ tier pills — the wedge is a
// price-anchored sentence, so the filter is the same sentence.
const CHIPS: { id: ChipId; emoji: string; label: string }[] = [
  { id: "high-protein", emoji: "🥩", label: "High protein" },
  { id: "under-15", emoji: "💸", label: "Under $15" },
  { id: "quick", emoji: "⚡", label: "Quick (under 5 min)" },
];

// "Open now" graduates from metric to chip only when the current result set's
// hours coverage clears the bar (Round 7 — Google hours lifted coverage past
// the chain-only ceiling). It filters to KNOWN-open venues: unknown hours are
// excluded while the chip is active — we never claim open without data.
const OPEN_NOW_CHIP: { id: ChipId; emoji: string; label: string } = {
  id: "open-now",
  emoji: "🕐",
  label: "Open now",
};

interface QuickFilterChipsProps {
  active: Set<ChipId>;
  onToggle: (id: ChipId) => void;
  /** Show the "Open now" chip — gated on ≥80% hours coverage upstream */
  showOpenNow?: boolean;
}

export function QuickFilterChips({ active, onToggle, showOpenNow = false }: QuickFilterChipsProps) {
  const chips = showOpenNow ? [...CHIPS, OPEN_NOW_CHIP] : CHIPS;
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-5 px-4">
      {chips.map((chip) => {
        const isActive = active.has(chip.id);
        return (
          <button
            key={chip.id}
            onClick={() => onToggle(chip.id)}
            className={`px-3.5 py-2 rounded-full text-[13px] border transition-colors cursor-pointer ${
              isActive
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#1A1A1A] border-[#E6E5DE] hover:border-[#C8C8C0]"
            }`}
            aria-pressed={isActive}
          >
            {chip.emoji} {chip.label}
          </button>
        );
      })}
    </div>
  );
}

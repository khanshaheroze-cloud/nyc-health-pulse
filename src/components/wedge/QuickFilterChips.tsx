"use client";

export type ChipId = "high-protein" | "quick" | "under-15";

// "Under $15" replaced the abstract $/$$/$$$ tier pills — the wedge is a
// price-anchored sentence, so the filter is the same sentence.
const CHIPS: { id: ChipId; emoji: string; label: string }[] = [
  { id: "high-protein", emoji: "🥩", label: "High protein" },
  { id: "under-15", emoji: "💸", label: "Under $15" },
  { id: "quick", emoji: "⚡", label: "Quick (under 5 min)" },
];

interface QuickFilterChipsProps {
  active: Set<ChipId>;
  onToggle: (id: ChipId) => void;
}

export function QuickFilterChips({ active, onToggle }: QuickFilterChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-5 px-4">
      {CHIPS.map((chip) => {
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

"use client";

export type ChipId = "high-protein" | "quick" | "price-1" | "price-2" | "price-3";

const CHIPS: { id: ChipId; emoji: string; label: string }[] = [
  { id: "high-protein", emoji: "🥩", label: "High protein" },
  { id: "quick", emoji: "⚡", label: "Quick (under 5 min)" },
];

interface QuickFilterChipsProps {
  active: Set<ChipId>;
  onToggle: (id: ChipId) => void;
}

const PRICE_TIERS: { id: ChipId; label: string }[] = [
  { id: "price-1", label: "$" },
  { id: "price-2", label: "$$" },
  { id: "price-3", label: "$$$" },
];

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

      {/* Connected price-tier pill group */}
      <div className="inline-flex rounded-full border border-[#E6E5DE] overflow-hidden">
        {PRICE_TIERS.map((tier, i) => {
          const isActive = active.has(tier.id);
          return (
            <button
              key={tier.id}
              onClick={() => onToggle(tier.id)}
              className={`px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                i > 0 ? "border-l border-[#E6E5DE]" : ""
              } ${
                isActive
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-white text-[#1A1A1A] hover:bg-[#F8F8F5]"
              }`}
              aria-pressed={isActive}
            >
              {tier.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

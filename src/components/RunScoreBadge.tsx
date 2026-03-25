"use client";

const GRADE_STYLES: Record<string, string> = {
  A: "bg-hp-green/15 text-hp-green border-hp-green/30",
  B: "bg-hp-blue/15 text-hp-blue border-hp-blue/30",
  C: "bg-hp-yellow/15 text-hp-yellow border-hp-yellow/30",
  D: "bg-hp-orange/15 text-hp-orange border-hp-orange/30",
  F: "bg-hp-red/15 text-hp-red border-hp-red/30",
};

export function RunScoreBadge({
  score,
  grade,
  size = "md",
}: {
  score: number;
  grade: string;
  size?: "sm" | "md" | "lg";
}) {
  const style = GRADE_STYLES[grade] ?? GRADE_STYLES.C;
  const sizeClass =
    size === "lg"
      ? "w-16 h-16 text-2xl"
      : size === "sm"
        ? "w-8 h-8 text-sm"
        : "w-11 h-11 text-lg";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`${sizeClass} rounded-xl border flex items-center justify-center font-extrabold ${style}`}
      >
        {grade}
      </div>
      <span className="text-[10px] text-muted">{score}/100</span>
    </div>
  );
}

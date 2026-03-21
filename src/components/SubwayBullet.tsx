/**
 * MTA subway bullet icon — circular colored disc with white (or black) letter.
 * The single most recognized NYC visual symbol.
 */

const LINE_COLORS: Record<string, { bg: string; fg: string }> = {
  "1": { bg: "#EE352E", fg: "#fff" },
  "2": { bg: "#EE352E", fg: "#fff" },
  "3": { bg: "#EE352E", fg: "#fff" },
  "4": { bg: "#00933C", fg: "#fff" },
  "5": { bg: "#00933C", fg: "#fff" },
  "6": { bg: "#00933C", fg: "#fff" },
  "7": { bg: "#B933AD", fg: "#fff" },
  "A": { bg: "#2850AD", fg: "#fff" },
  "C": { bg: "#2850AD", fg: "#fff" },
  "E": { bg: "#2850AD", fg: "#fff" },
  "B": { bg: "#FF6319", fg: "#fff" },
  "D": { bg: "#FF6319", fg: "#fff" },
  "F": { bg: "#FF6319", fg: "#fff" },
  "M": { bg: "#FF6319", fg: "#fff" },
  "G": { bg: "#6CBE45", fg: "#fff" },
  "J": { bg: "#996633", fg: "#fff" },
  "Z": { bg: "#996633", fg: "#fff" },
  "L": { bg: "#A7A9AC", fg: "#fff" },
  "N": { bg: "#FCCC0A", fg: "#000" },
  "Q": { bg: "#FCCC0A", fg: "#000" },
  "R": { bg: "#FCCC0A", fg: "#000" },
  "W": { bg: "#FCCC0A", fg: "#000" },
  "S": { bg: "#808183", fg: "#fff" },
};

/** One line letter per borough — the "signature" train for each. */
export const BOROUGH_LINE: Record<string, string> = {
  Bronx:         "4",
  Brooklyn:      "F",
  Manhattan:     "A",
  Queens:        "7",
  "Staten Island": "S",
};

export function SubwayBullet({ line, size = 18 }: { line: string; size?: number }) {
  const key = line.toUpperCase();
  const { bg, fg } = LINE_COLORS[key] ?? { bg: "#808183", fg: "#fff" };

  return (
    <span
      aria-label={`Subway line ${line}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bg,
        color: fg,
        fontSize: size * 0.52,
        fontWeight: 700,
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        flexShrink: 0,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        userSelect: "none",
        marginRight: 2,
        boxShadow: "0 0 0 1.5px rgba(0,0,0,.12)",
      }}
    >
      {key}
    </span>
  );
}

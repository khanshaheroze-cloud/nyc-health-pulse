export type TimeBand = "dawn" | "morning" | "afternoon" | "golden" | "sunset" | "dusk" | "night";

// NYC-timezone time band. Shared by EnvironmentBackdrop (gradient choice) and
// WedgeHero (text contrast) so the hero copy always matches the backdrop.
export function getTimeBand(): TimeBand {
  const nycHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()),
    10,
  );
  const nycMin = parseInt(
    new Intl.DateTimeFormat("en-US", { minute: "numeric", timeZone: "America/New_York" }).format(new Date()),
    10,
  );
  const t = nycHour * 60 + nycMin;
  if (t >= 300 && t < 420) return "dawn";
  if (t >= 420 && t < 660) return "morning";
  if (t >= 660 && t < 960) return "afternoon";
  if (t >= 960 && t < 1110) return "golden";
  if (t >= 1110 && t < 1230) return "sunset";
  if (t >= 1230 && t < 1350) return "dusk";
  return "night";
}

// Bands whose gradient top is dark enough that default dark text fails 4.5:1
export function isDarkBand(band: TimeBand): boolean {
  return band === "dusk" || band === "night";
}

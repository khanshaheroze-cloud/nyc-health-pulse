// ─── FONT THEME SWITCH ───────────────────────────────────────────────────────
// The ONE line to change to compare type directions. Build-time constant — only
// the re-exported module's fonts are bundled/preloaded (no runtime switching,
// the two inactive themes ship zero bytes).
//
//   "./fraunces"   — Fraunces display + Inter body (PRIMARY)
//   "./bricolage"  — Bricolage Grotesque display + Inter body
//   "./newsreader" — Newsreader display + Plus Jakarta body
//
// Every component consumes fonts via the CSS tokens --font-display / --font-sans
// (globals.css @theme) — no component may import next/font directly.
export { FONT_THEME, fontVariables } from "./fraunces";

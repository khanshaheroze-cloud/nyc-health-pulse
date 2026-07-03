import { Fraunces, Inter } from "next/font/google";

// PRIMARY direction — healthtech-meets-food: warm editorial soft serif over a
// quiet, data-credible sans.
//
// Display: Fraunces variable. opsz is auto (optical sizing on), and the SOFT /
// WONK axes ship so CSS can pin "SOFT" 90 / "WONK" 0 (see globals.css
// .font-display) — rounded and food-warm, wonky letterforms off.
// Body: Inter variable — quieter and more app-native than Plus Jakarta, with
// excellent tabular figures for macros/prices/AQI.
const display = Fraunces({
  variable: "--font-display-face",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body-face",
  subsets: ["latin"],
  display: "swap",
});

export const FONT_THEME = "fraunces";
export const fontVariables = `${display.variable} ${body.variable}`;

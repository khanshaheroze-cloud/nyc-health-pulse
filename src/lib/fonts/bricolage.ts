import { Bricolage_Grotesque, Inter } from "next/font/google";

// ALTERNATE "bricolage" — modern characterful grotesk display over Inter.
// Less editorial, more tech than the Fraunces primary.
const display = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body-face",
  subsets: ["latin"],
  display: "swap",
});

export const FONT_THEME = "bricolage";
export const fontVariables = `${display.variable} ${body.variable}`;

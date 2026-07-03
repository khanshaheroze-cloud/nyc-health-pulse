import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";

// ALTERNATE "newsreader" — the quietest editorial option: Newsreader display
// over the existing Plus Jakarta body.
const display = Newsreader({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const FONT_THEME = "newsreader";
export const fontVariables = `${display.variable} ${body.variable}`;

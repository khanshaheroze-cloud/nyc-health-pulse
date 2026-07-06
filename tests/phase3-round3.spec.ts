import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// ── Fonts module is the sole font source (grep-based lint) ───────────────────
test("no component imports next/font directly — fonts centralize in src/lib/fonts", () => {
  const root = path.join(process.cwd(), "src");
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        // The fonts module is the ONE allowed place to import next/font.
        if (full.replace(/\\/g, "/").includes("src/lib/fonts/")) continue;
        const src = fs.readFileSync(full, "utf8");
        if (/from ["']next\/font/.test(src)) offenders.push(full);
      }
    }
  };
  walk(root);
  expect(offenders, `next/font imported outside src/lib/fonts:\n${offenders.join("\n")}`).toEqual([]);
});

test("no DM Serif Display references remain (only the newsreader alternate keeps Plus Jakarta)", () => {
  const root = path.join(process.cwd(), "src");
  const dmSerif: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
        const src = fs.readFileSync(full, "utf8");
        if (/DM_Serif_Display|DM Serif Display|dm-serif/.test(src)) dmSerif.push(full);
      }
    }
  };
  walk(root);
  expect(dmSerif).toEqual([]);
});

// ── Static icon assets exist ─────────────────────────────────────────────────
test("apple-icon.png + icon PNGs are real files in public/", () => {
  const pub = path.join(process.cwd(), "public");
  for (const f of ["apple-icon.png", "icon-192.png", "icon-512.png"]) {
    const p = path.join(pub, f);
    expect(fs.existsSync(p), `${f} missing`).toBe(true);
    expect(fs.statSync(p).size).toBeGreaterThan(500);
  }
});

test("no next.config redirect aliases /apple-icon.png", () => {
  const cfg = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
  expect(/source:\s*["']\/apple-icon\.png["']/.test(cfg)).toBe(false);
});

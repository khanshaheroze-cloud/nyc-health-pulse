#!/usr/bin/env node
// Post-deploy smoke check (round 5): fail LOUDLY if the live homepage still
// serves a stale/hand-typed proof line instead of the data-derived one.
//
//   node scripts/postdeploy-smoke.mjs [url]        (default https://pulsenyc.app/)
//
// Run automatically by `pnpm deploy:prod`. Exit code 1 = the deploy did not
// actually reach the live domain — do not walk away.

const url = process.argv[2] || "https://pulsenyc.app/";

// The data-derived proof line always starts "<n> chains with full nutrition"
// (WedgeSection, round 4+). The pre-round-4 hand-typed line lacked it.
const REQUIRED = [
  { re: /\d+ chains with full nutrition/, why: "data-derived proof line prefix (round 4+ build)" },
  { re: /(curated LIC guide|LIC menus verified in person)/, why: "honest LIC claim (curated until verification lands)" },
  { re: /\d{1,3},000\+ NYC restaurants rated/, why: "data-derived graded-restaurant floor" },
];

// Cache-bust query to skip any CDN edge entry; also send no-cache.
const bust = `${url}${url.includes("?") ? "&" : "?"}smoke=${Math.floor(Math.random() * 1e9)}`;

try {
  const res = await fetch(bust, { headers: { "cache-control": "no-cache", pragma: "no-cache" } });
  if (!res.ok) {
    console.error(`✗ SMOKE FAIL: ${url} responded ${res.status}`);
    process.exit(1);
  }
  // React SSR interleaves text nodes with <!-- --> markers ("55<!-- --> chains
  // with full nutrition") — strip comments before matching.
  const html = (await res.text()).replace(/<!--.*?-->/g, "");
  let failed = false;
  for (const { re, why } of REQUIRED) {
    if (!re.test(html)) {
      console.error(`✗ SMOKE FAIL: live HTML missing ${re} — ${why}`);
      failed = true;
    }
  }
  if (failed) {
    console.error("The live homepage is serving a stale prerender. Re-deploy with --force and re-run, or wait out the 3600s ISR window and verify again.");
    process.exit(1);
  }
  const m = html.match(/(\d{1,3},000\+) NYC restaurants rated/);
  console.log(`✓ smoke ok: ${url} serves the data-derived proof line (${m ? m[1] : "?"} rated)`);
} catch (err) {
  console.error(`✗ SMOKE FAIL: could not fetch ${url}:`, err.message);
  process.exit(1);
}

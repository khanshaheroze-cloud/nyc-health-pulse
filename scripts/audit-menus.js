#!/usr/bin/env node

/**
 * Menu freshness & coverage audit — CI-safe.
 * Run: `npm run audit-menus`       (human-friendly report)
 *      `npm run ci:menus`          (alias — exits 1 on any failure)
 *
 * Exit code 1 if:
 *  - Any chain item exceeds 90-day SLA
 *  - Any template exceeds 180-day SLA
 *  - Any chain has fewer than 10 items
 *  - Any chain lacks source references
 */

const fs = require("fs");
const path = require("path");

const CHAIN_DIR = path.join(__dirname, "../src/data/eat-smart/menus");
const TEMPLATE_DIR = path.join(__dirname, "../src/data/eat-smart/cuisine-templates");

const CHAIN_STALE_DAYS = 90;
const TEMPLATE_STALE_DAYS = 180;
const CHAIN_MIN_ITEMS = 10;
const TEMPLATE_MIN_ITEMS = 8;

const NOW = Date.now();
const DAY_MS = 86400000;
const isCI = process.env.CI === "true" || process.argv.includes("--ci");

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((NOW - d.getTime()) / DAY_MS);
}

function statusIcon(days, threshold) {
  if (days === null) return "⚪";
  if (days <= threshold * 0.5) return "✅";
  if (days <= threshold) return "⚠️ ";
  return "❌";
}

const failures = [];

console.log(`\nMenu freshness report (${new Date().toISOString().slice(0, 10)})`);
console.log("─".repeat(55));

// ── Chain Menus ──
const chainFiles = fs.readdirSync(CHAIN_DIR).filter(f => f.endsWith(".ts") && f !== "index.ts");
console.log(`\n📦 Chain Menus (${chainFiles.length} files, ${CHAIN_STALE_DAYS}-day SLA)\n`);

let totalChainItems = 0;

for (const file of chainFiles.sort()) {
  const content = fs.readFileSync(path.join(CHAIN_DIR, file), "utf-8");
  const name = file.replace(".ts", "");

  const itemCount = (content.match(/id:\s*"/g) || []).length;
  totalChainItems += itemCount;

  const lastUpdatedMatch = content.match(/lastUpdated:\s*"([^"]+)"/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : null;
  const days = daysSince(lastUpdated);

  const verifiedDates = [...content.matchAll(/lastVerified:\s*"([^"]+)"/g)].map(m => m[1]);
  const oldestVerified = verifiedDates.length > 0 ? verifiedDates.sort()[0] : null;
  const verifiedDays = daysSince(oldestVerified);
  const hasSourceRefs = verifiedDates.length > 0;

  // Failure checks
  if (days !== null && days > CHAIN_STALE_DAYS) {
    failures.push(`${name}: menu is ${days}d old (SLA: ${CHAIN_STALE_DAYS}d)`);
  }
  if (!hasSourceRefs) {
    failures.push(`${name}: no source references`);
  }
  if (itemCount < CHAIN_MIN_ITEMS) {
    failures.push(`${name}: only ${itemCount} items (min: ${CHAIN_MIN_ITEMS})`);
  }
  if (verifiedDays !== null && verifiedDays > CHAIN_STALE_DAYS) {
    failures.push(`${name}: oldest verified source is ${verifiedDays}d old`);
  }

  // v2 field checks
  const hasSatFat = /saturatedFat:/.test(content);
  if (!hasSatFat) {
    failures.push(`${name}: missing saturatedFat on items`);
  }
  const drinkItems = (content.match(/isDrink:\s*true/g) || []).length;
  const sweetenerTypes = (content.match(/sweetenerType:/g) || []).length;
  if (drinkItems > 0 && sweetenerTypes < drinkItems) {
    failures.push(`${name}: ${drinkItems - sweetenerTypes} drink item(s) missing sweetenerType`);
  }

  const icon = statusIcon(days, CHAIN_STALE_DAYS);
  const verifiedLabel = hasSourceRefs
    ? ` | oldest verified: ${oldestVerified} (${verifiedDays}d)`
    : " | ⚠ no source refs";

  console.log(`${icon} ${name.padEnd(20)} — ${itemCount} items, last updated ${lastUpdated ?? "unknown"} (${days ?? "?"}d)${verifiedLabel}`);
}

// ── Cuisine Templates ──
const templateFiles = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith(".ts") && f !== "index.ts");
console.log(`\n🌍 Cuisine Templates (${templateFiles.length} files, ${TEMPLATE_STALE_DAYS}-day SLA)\n`);

for (const file of templateFiles.sort()) {
  const content = fs.readFileSync(path.join(TEMPLATE_DIR, file), "utf-8");
  const name = file.replace(".ts", "");

  const itemCount = (content.match(/id:\s*"/g) || []).length;

  const lastUpdatedMatch = content.match(/lastUpdated:\s*"([^"]+)"/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : null;
  const days = daysSince(lastUpdated);

  if (days !== null && days > TEMPLATE_STALE_DAYS) {
    failures.push(`template/${name}: menu is ${days}d old (SLA: ${TEMPLATE_STALE_DAYS}d)`);
  }
  if (itemCount < TEMPLATE_MIN_ITEMS && name !== "fallback") {
    failures.push(`template/${name}: only ${itemCount} items (min: ${TEMPLATE_MIN_ITEMS})`);
  }

  const icon = statusIcon(days, TEMPLATE_STALE_DAYS);
  console.log(`${icon} ${name.padEnd(20)} — ~${itemCount} items, last updated ${lastUpdated ?? "unknown"} (${days ?? "?"}d)`);
}

// ── Summary ──
console.log("\n" + "─".repeat(55));
console.log(`Total: ${chainFiles.length} chain menus (${totalChainItems} items) + ${templateFiles.length} cuisine templates`);
console.log(`Chain target: 12-15 items each | Template target: 10-12 items each`);

if (failures.length > 0) {
  console.log(`\n❌ FAIL: ${failures.length} issue(s) found:\n`);
  for (const f of failures) console.log(`  • ${f}`);
  process.exit(1);
} else {
  console.log("\n✅ All menus within freshness SLA.");
}

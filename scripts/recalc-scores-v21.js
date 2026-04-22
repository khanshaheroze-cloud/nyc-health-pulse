#!/usr/bin/env node
/**
 * Recalculate all pulseScore / drinkScore values using PulseScore v2.1 formula.
 * Run: node scripts/recalc-scores-v21.js
 */

const fs = require("fs");
const path = require("path");

const DIRS = [
  path.join(__dirname, "../src/data/eat-smart/menus"),
  path.join(__dirname, "../src/data/eat-smart/cuisine-templates"),
];

function calculateFoodPulseScore(item) {
  let score = 0;
  const ratio = item.protein > 0 ? item.calories / item.protein : Infinity;
  if (ratio <= 7) score += 55;
  else if (ratio <= 10) score += 50;
  else if (ratio <= 14) score += 43;
  else if (ratio <= 18) score += 32;
  else if (ratio <= 25) score += 20;
  else if (ratio <= 35) score += 12;

  const proteinCalPct = item.calories > 0 ? (item.protein * 4 / item.calories) * 100 : 0;
  if (proteinCalPct >= 55) score += 8;
  else if (proteinCalPct >= 35) score += 5;
  else if (proteinCalPct >= 22) score += 2;

  if (item.protein >= 40) score += 15;
  else if (item.protein >= 30) score += 12;
  else if (item.protein >= 20) score += 6;
  else if (item.protein >= 10) score += 3;

  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    if (fiberPer100 >= 2.5) score += 18;
    else if (fiberPer100 >= 1.5) score += 14;
    else if (fiberPer100 >= 0.8) score += 10;
    else if (fiberPer100 >= 0.4) score += 4;
  }

  if (item.calories <= 300) score += 15;
  else if (item.calories <= 450) score += 12;
  else if (item.calories <= 600) score += 8;
  else if (item.calories <= 800) score += 4;

  const satFat = item.saturatedFat;
  if (satFat != null) {
    if (satFat > 15) score -= 8;
    else if (satFat > 10) score -= 4;
    else if (satFat > 7) score -= 2;
  }

  const addedSugar = item.addedSugar ?? 0;
  if (addedSugar > 20) score -= 6;
  else if (addedSugar > 12) score -= 3;
  else if (addedSugar > 6) score -= 1;

  if (item.sodium != null) {
    if (item.sodium > 1800) score -= 6;
    else if (item.sodium > 1500) score -= 3;
    else if (item.sodium > 1200) score -= 1;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateDrinkScore(item) {
  let score = 0;
  if (item.protein >= 25) score += 42;
  else if (item.protein >= 15) score += 36;
  else if (item.protein >= 10) score += 28;
  else if (item.protein >= 5) score += 18;
  else if (item.protein >= 2) score += 8;

  const sugar = item.sugar ?? 0;
  if (sugar === 0) score += 28;
  else if (sugar <= 5) score += 22;
  else if (sugar <= 10) score += 15;
  else if (sugar <= 15) score += 9;
  else if (sugar <= 25) score += 3;

  if (item.calories <= 10) score += 20;
  else if (item.calories <= 50) score += 16;
  else if (item.calories <= 100) score += 12;
  else if (item.calories <= 180) score += 7;
  else if (item.calories <= 300) score += 3;

  const satFat = item.saturatedFat ?? 0;
  if (satFat <= 1) score += 10;
  else if (satFat <= 3) score += 7;
  else if (satFat <= 6) score += 3;

  const st = item.sweetenerType ?? (sugar === 0 ? "none" : sugar <= 5 ? "minimal-sugar" : "full-sugar");
  if (st === "none") score += 10;
  else if (st === "natural-zero") score += 8;
  else if (st === "sugar-free") score += 5;
  else if (st === "minimal-sugar") score += 3;

  if (item.protein >= 20 && item.calories <= 300) score += 12;
  else if (item.protein >= 10 && item.calories <= 250) score += 8;
  else if (item.protein >= 5 && item.calories <= 200) score += 4;

  return Math.max(0, Math.min(100, score));
}

function extractNum(text, field) {
  const m = text.match(new RegExp(field + ":\\s*([\\d.]+)"));
  return m ? parseFloat(m[1]) : null;
}

function extractStr(text, field) {
  const m = text.match(new RegExp(field + ':\\s*"([^"]*)"'));
  return m ? m[1] : null;
}

let totalUpdated = 0;
let totalFiles = 0;
const report = [];

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") && f !== "index.ts");

  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf-8");
    let fileChanges = 0;

    const itemBlockRegex = /(\{[\s\S]*?id:\s*"[^"]+?"[\s\S]*?calories:\s*\d+[\s\S]*?\})\s*,/g;
    let match;
    const replacements = [];

    while ((match = itemBlockRegex.exec(content)) !== null) {
      const block = match[1];
      const id = extractStr(block, "id");
      if (!id) continue;

      const isDrink = /isDrink:\s*true/.test(block);
      const calories = extractNum(block, "calories") ?? 0;
      const protein = extractNum(block, "protein") ?? 0;
      const fiber = extractNum(block, "fiber");
      const sodium = extractNum(block, "sodium");
      const sugar = extractNum(block, "sugar");
      const addedSugar = extractNum(block, "addedSugar");
      const saturatedFat = extractNum(block, "saturatedFat");
      const sweetenerType = extractStr(block, "sweetenerType");

      const item = { calories, protein, fiber, sodium, sugar, addedSugar, saturatedFat, sweetenerType };

      let newPulseScore, newDrinkScore;
      if (isDrink) {
        newDrinkScore = calculateDrinkScore(item);
        newPulseScore = newDrinkScore;
      } else {
        newPulseScore = calculateFoodPulseScore(item);
      }

      const oldPulseScore = extractNum(block, "pulseScore");
      const oldDrinkScore = extractNum(block, "drinkScore");

      let newBlock = block;
      newBlock = newBlock.replace(/pulseScore:\s*\d+/, `pulseScore: ${newPulseScore}`);
      if (isDrink && /drinkScore:/.test(newBlock)) {
        newBlock = newBlock.replace(/drinkScore:\s*\d+/, `drinkScore: ${newDrinkScore}`);
      }

      if (newBlock !== block) {
        replacements.push({ old: block, new: newBlock });
        fileChanges++;
        const name = extractStr(block, "name") || id;
        report.push({
          file: file.replace(".ts", ""),
          name,
          isDrink,
          oldScore: isDrink ? (oldDrinkScore ?? oldPulseScore) : oldPulseScore,
          newScore: isDrink ? newDrinkScore : newPulseScore,
        });
      }
    }

    for (const r of replacements) {
      content = content.replace(r.old, r.new);
    }

    if (fileChanges > 0) {
      fs.writeFileSync(filePath, content, "utf-8");
      totalUpdated += fileChanges;
      totalFiles++;
      console.log(`✅ ${file}: ${fileChanges} items updated`);
    }
  }
}

console.log(`\n─── Summary ───`);
console.log(`${totalUpdated} items recalculated across ${totalFiles} files`);

// Show key items
const keyItems = [
  "Grilled Nuggets (12-Count)", "Chicken Bowl (No Rice)", "Harvest Bowl",
  "Guacamole Greens", "Roasted Chicken Plate", "Super Green Goddess",
  "Unsweetened Cold Brew", "Vanilla Protein Sip", "Cold Brew with Oat Milk",
  "Grilled Chicken Wings", "Edamame", "Crispy Rice Treat"
];
console.log(`\n─── Key item scores ───`);
for (const r of report) {
  if (keyItems.some(k => r.name.includes(k))) {
    console.log(`  ${r.file.padEnd(16)} ${r.name.padEnd(42).slice(0, 42)} ${String(r.oldScore ?? '?').padStart(3)} → ${String(r.newScore).padStart(3)} ${r.isDrink ? '(drink)' : '(food)'}`);
  }
}

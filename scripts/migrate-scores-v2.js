#!/usr/bin/env node
/**
 * One-time migration: add saturatedFat, addedSugar, sweetenerType to all menu items,
 * recalculate pulseScore using v2 formula, and add drinkScore for drinks.
 */

const fs = require("fs");
const path = require("path");

const CHAIN_DIR = path.join(__dirname, "../src/data/eat-smart/menus");
const TEMPLATE_DIR = path.join(__dirname, "../src/data/eat-smart/cuisine-templates");

// ── Scoring functions (mirrors pulse-score.ts) ──

function calculateFoodPulseScore({ calories, protein, fiber, sodium, sugar, addedSugar, saturatedFat }) {
  let score = 0;
  const p = protein ?? 0;
  const ratio = p > 0 ? calories / p : Infinity;
  if (ratio <= 10) score += 45;
  else if (ratio <= 13) score += 38;
  else if (ratio <= 17) score += 30;
  else if (ratio <= 22) score += 20;
  else if (ratio <= 35) score += 10;

  if (p >= 40) score += 10;
  else if (p >= 30) score += 7;
  else if (p >= 20) score += 4;

  if (fiber != null && calories > 0) {
    const fiberPer100 = (fiber / calories) * 100;
    if (fiberPer100 >= 3) score += 15;
    else if (fiberPer100 >= 2) score += 11;
    else if (fiberPer100 >= 1) score += 7;
    else if (fiberPer100 >= 0.5) score += 3;
  }

  if (calories <= 300) score += 15;
  else if (calories <= 450) score += 12;
  else if (calories <= 600) score += 8;
  else if (calories <= 800) score += 4;

  const as = addedSugar ?? sugar ?? 0;
  if (as > 25) score -= 10;
  else if (as > 15) score -= 6;
  else if (as > 8) score -= 3;

  const sf = saturatedFat ?? 0;
  if (sf > 12) score -= 10;
  else if (sf > 8) score -= 6;
  else if (sf > 5) score -= 3;

  if (sodium != null) {
    if (sodium > 1800) score -= 10;
    else if (sodium > 1200) score -= 6;
    else if (sodium > 900) score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateDrinkScore({ calories, protein, fiber, sugar, saturatedFat, sweetenerType }) {
  let score = 0;
  const p = protein ?? 0;
  if (p >= 15) score += 35;
  else if (p >= 10) score += 28;
  else if (p >= 5) score += 18;
  else if (p >= 2) score += 8;

  const s = sugar ?? 0;
  if (s === 0) score += 25;
  else if (s <= 5) score += 20;
  else if (s <= 10) score += 14;
  else if (s <= 20) score += 7;
  else if (s <= 30) score += 2;

  if (calories <= 10) score += 15;
  else if (calories <= 50) score += 12;
  else if (calories <= 100) score += 9;
  else if (calories <= 150) score += 6;
  else if (calories <= 250) score += 3;

  const sf = saturatedFat ?? 0;
  if (sf <= 1) score += 10;
  else if (sf <= 3) score += 7;
  else if (sf <= 6) score += 3;

  const f = fiber ?? 0;
  if (f >= 3) score += 5;
  else if (f >= 1) score += 2;

  const st = sweetenerType ?? (s === 0 ? "none" : s <= 5 ? "minimal-sugar" : "full-sugar");
  if (st === "none") score += 10;
  else if (st === "natural-zero") score += 8;
  else if (st === "sugar-free") score += 5;
  else if (st === "minimal-sugar") score += 3;

  return Math.max(0, Math.min(100, score));
}

// ── Field estimation helpers ──

function estimateSaturatedFat(fat, isDrink, name) {
  if (fat == null || fat === 0) return 0;
  const n = (name || "").toLowerCase();
  // Dairy-heavy items
  if (n.includes("cheese") || n.includes("mac &") || n.includes("pizza")) return Math.round(fat * 0.50);
  if (n.includes("cream") || n.includes("latte") || n.includes("macchiato")) return Math.round(fat * 0.55);
  // Fried items
  if (n.includes("fried") || n.includes("fries") || n.includes("crispy") || n.includes("tempura")) return Math.round(fat * 0.30);
  // Meat items
  if (n.includes("burger") || n.includes("steak") || n.includes("bacon") || n.includes("sausage")) return Math.round(fat * 0.40);
  if (n.includes("chicken") || n.includes("turkey")) return Math.round(fat * 0.30);
  // Plant-based
  if (n.includes("salad") || n.includes("veggie") || n.includes("vegan") || n.includes("tofu")) return Math.round(fat * 0.15);
  if (n.includes("avocado") || n.includes("hummus")) return Math.round(fat * 0.15);
  // Default
  return Math.round(fat * 0.33);
}

function estimateAddedSugar(sugar, isDrink, name) {
  if (sugar == null || sugar === 0) return 0;
  const n = (name || "").toLowerCase();
  // Unsweetened drinks — sugar from milk, not added
  if (isDrink && (n.includes("unsweetened") || n.includes("americano") || n.includes("cold brew") || n.includes("black"))) {
    return 0;
  }
  // Drinks with syrup
  if (isDrink) return sugar;
  // Food items — most fast food sugar is added
  if (n.includes("oatmeal") || n.includes("fruit") || n.includes("apple")) return Math.round(sugar * 0.5);
  return sugar;
}

function estimateSweetenerType(item) {
  if (!item.isDrink) return undefined;
  const n = (item.name || "").toLowerCase();
  const s = item.sugar ?? 0;
  if (s === 0 && (n.includes("water") || n.includes("tea") || n.includes("americano") || n.includes("cold brew") || n.includes("black coffee") || n.includes("espresso"))) return "none";
  if (n.includes("sf ") || n.includes("sugar-free") || n.includes("sugar free") || n.includes("diet")) return "sugar-free";
  if (n.includes("1 pump") || n.includes("light") || n.includes("skinny")) return "minimal-sugar";
  if (s === 0) return "none";
  if (s <= 5) return "minimal-sugar";
  if (s <= 12) return "minimal-sugar";
  return "full-sugar";
}

// ── File processing ──

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);

  // Find each item block by finding `id: "` and processing until the next item or end
  // Strategy: find each item's fields, add missing ones, recalculate scores

  // Extract each item block — items are { ... } with id: "..."
  // Use [\s\S] to match across newlines; items don't nest braces
  const itemRegex = /(\{[\s\S]*?id:\s*"[^"]+?"[\s\S]*?isDrink:\s*(?:true|false)[\s\S]*?\})/g;

  let changed = false;

  content = content.replace(itemRegex, (block) => {
    // Extract fields
    const getId = block.match(/id:\s*"([^"]+)"/);
    const getName = block.match(/name:\s*"([^"]+)"/);
    const getCal = block.match(/calories:\s*(\d+)/);
    const getProtein = block.match(/protein:\s*(\d+)/);
    const getFat = block.match(/fat:\s*(\d+)/);
    const getFiber = block.match(/fiber:\s*(\d+)/);
    const getSodium = block.match(/sodium:\s*(\d+)/);
    const getSugar = block.match(/sugar:\s*(\d+)/);
    const getIsDrink = block.match(/isDrink:\s*(true|false)/);
    const getScore = block.match(/pulseScore:\s*(\d+)/);

    if (!getCal || !getIsDrink) return block;

    const name = getName ? getName[1] : "";
    const calories = parseInt(getCal[1]);
    const protein = getProtein ? parseInt(getProtein[1]) : 0;
    const fat = getFat ? parseInt(getFat[1]) : null;
    const fiber = getFiber ? parseInt(getFiber[1]) : null;
    const sodium = getSodium ? parseInt(getSodium[1]) : null;
    const sugar = getSugar ? parseInt(getSugar[1]) : null;
    const isDrink = getIsDrink[1] === "true";

    // Check if already has new fields
    const hasSatFat = /saturatedFat:/.test(block);
    const hasAddedSugar = /addedSugar:/.test(block);
    const hasSweetenerType = /sweetenerType:/.test(block);
    const hasDrinkScore = /drinkScore:/.test(block);

    let newBlock = block;

    // Add saturatedFat after fat field (or after sodium if no fat)
    const satFat = hasSatFat ? null : estimateSaturatedFat(fat, isDrink, name);
    if (satFat !== null && !hasSatFat) {
      if (fat != null) {
        newBlock = newBlock.replace(/(fat:\s*\d+,)/, `$1\n      saturatedFat: ${satFat},`);
      } else if (sodium != null) {
        newBlock = newBlock.replace(/(sodium:\s*\d+,)/, `saturatedFat: ${satFat},\n      $1`);
      } else {
        newBlock = newBlock.replace(/(calories:\s*\d+,)/, `$1\n      saturatedFat: ${satFat},`);
      }
      changed = true;
    }

    // Add addedSugar after sugar field
    const addedSug = hasAddedSugar ? null : estimateAddedSugar(sugar, isDrink, name);
    if (addedSug !== null && !hasAddedSugar && sugar != null) {
      newBlock = newBlock.replace(/(sugar:\s*\d+,)/, `$1\n      addedSugar: ${addedSug},`);
      changed = true;
    }

    // Add sweetenerType for drinks
    if (isDrink && !hasSweetenerType) {
      const st = estimateSweetenerType({ isDrink, name, sugar });
      if (st) {
        newBlock = newBlock.replace(/(isDrink:\s*true,)/, `$1\n      sweetenerType: "${st}",`);
        changed = true;
      }
    }

    // Recalculate scores
    const currentSatFat = hasSatFat
      ? parseInt((block.match(/saturatedFat:\s*(\d+)/) || [])[1] || "0")
      : (satFat ?? 0);
    const currentAddedSugar = hasAddedSugar
      ? parseInt((block.match(/addedSugar:\s*(\d+)/) || [])[1] || "0")
      : (addedSug ?? (sugar ?? 0));

    if (isDrink) {
      const st = hasSweetenerType
        ? (block.match(/sweetenerType:\s*"([^"]+)"/) || [])[1]
        : estimateSweetenerType({ isDrink, name, sugar });
      const ds = calculateDrinkScore({ calories, protein, fiber, sugar, saturatedFat: currentSatFat, sweetenerType: st });

      // Update pulseScore to drinkScore value (drinks use drinkScore as their display score)
      newBlock = newBlock.replace(/pulseScore:\s*\d+/, `pulseScore: ${ds}`);

      // Add drinkScore field
      if (!hasDrinkScore) {
        newBlock = newBlock.replace(/(pulseScore:\s*\d+,)/, `$1\n      drinkScore: ${ds},`);
        changed = true;
      } else {
        newBlock = newBlock.replace(/drinkScore:\s*\d+/, `drinkScore: ${ds}`);
      }
    } else {
      const newScore = calculateFoodPulseScore({
        calories, protein, fiber, sodium, sugar, addedSugar: currentAddedSugar, saturatedFat: currentSatFat,
      });
      const oldScore = getScore ? parseInt(getScore[1]) : 0;
      if (newScore !== oldScore) {
        newBlock = newBlock.replace(/pulseScore:\s*\d+/, `pulseScore: ${newScore}`);
        changed = true;
      }
    }

    return newBlock;
  });

  if (changed) {
    // Ensure SweetenerType import exists if we added sweetenerType fields
    if (content.includes("sweetenerType:") && !content.includes("SweetenerType")) {
      content = content.replace(
        /import type \{ (.*?) \} from "@\/lib\/eat-smart\/types"/,
        (m, types) => {
          if (types.includes("SweetenerType")) return m;
          return `import type { ${types}, SweetenerType } from "@/lib/eat-smart/types"`;
        }
      );
    }
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✅ Updated: ${fileName}`);
  } else {
    console.log(`⏭️  No changes: ${fileName}`);
  }
}

// ── Main ──

const chainFiles = fs.readdirSync(CHAIN_DIR)
  .filter(f => f.endsWith(".ts") && f !== "index.ts")
  .map(f => path.join(CHAIN_DIR, f));

const templateFiles = fs.readdirSync(TEMPLATE_DIR)
  .filter(f => f.endsWith(".ts") && f !== "index.ts")
  .map(f => path.join(TEMPLATE_DIR, f));

console.log(`\nMigrating ${chainFiles.length} chains + ${templateFiles.length} templates to v2 scoring...\n`);

for (const f of [...chainFiles, ...templateFiles]) {
  processFile(f);
}

console.log("\nDone! Run `npx tsc --noEmit` to verify types.");

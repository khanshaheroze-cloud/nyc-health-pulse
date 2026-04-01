/**
 * Multi-signal relevance scoring for food search results.
 * Used by both client-side common foods search and server-side API route
 * to ensure consistent ranking across all data sources.
 */

/**
 * Score how well a food item matches a search query.
 * Higher score = better match. Returns 0 if no meaningful match.
 *
 * Scoring signals (priority order):
 * 1. Exact phrase match in name → 1000 pts
 * 2. Exact phrase match in alias → 900 pts
 * 3. All query words present in name → 500 + 100/word
 * 4. All query words across name+aliases → 400 + 100/word
 * 5. Partial word matches → scaled by match ratio (penalizes low overlap)
 * 6. Bonus: name IS the query → +200
 * 7. Bonus: word order matches → +50
 * 8. Penalty: excess unrelated words in name → -10/word
 */
export function scoreSearchResult(query: string, foodName: string, aliases: string[] = []): number {
  const q = query.toLowerCase().trim();
  const name = foodName.toLowerCase().trim();
  const queryWords = q.split(/\s+/).filter(w => w.length > 1); // ignore single-char words
  const nameWords = name.split(/[\s,()[\]\-/]+/).filter(w => w.length > 1);

  if (queryWords.length === 0) {
    // Fallback for single-char queries like "e" — just use exact contains
    const singleChar = query.toLowerCase().trim();
    if (singleChar.length === 1) return 0; // too short to match
    return name.includes(singleChar) ? 1000 : 0;
  }

  let score = 0;

  // Signal 1: Exact phrase match in name
  if (name.includes(q)) {
    score += 1000;
    if (name === q || name.startsWith(q + " ") || name.startsWith(q + ",")) {
      score += 200;
    }
  }
  // Signal 2: Exact phrase match in any alias
  else if (aliases.some(a => a.toLowerCase().includes(q))) {
    score += 900;
    if (aliases.some(a => a.toLowerCase() === q)) {
      score += 100;
    }
  }
  // Signal 3+4+5: Word-level matching
  else {
    const matchingWords = queryWords.filter(qw =>
      nameWords.some(nw => nw.includes(qw) || qw.includes(nw))
    );
    const matchRatio = matchingWords.length / queryWords.length;

    if (matchRatio === 1) {
      // All words present in name
      score += 500 + (matchingWords.length * 100);
    } else if (matchRatio > 0) {
      // Check aliases for remaining words
      const aliasText = aliases.join(" ").toLowerCase();
      const aliasWords = aliasText.split(/[\s,()[\]\-/]+/).filter(w => w.length > 1);
      const aliasMatchingWords = queryWords.filter(qw =>
        nameWords.some(nw => nw.includes(qw) || qw.includes(nw)) ||
        aliasWords.some(aw => aw.includes(qw) || qw.includes(aw))
      );

      if (aliasMatchingWords.length === queryWords.length) {
        // All words found across name + aliases
        score += 400 + (aliasMatchingWords.length * 100);
      } else {
        // Partial match — scale by ratio so 1-of-3 matches score much lower than 2-of-3
        const partialRatio = aliasMatchingWords.length / queryWords.length;
        // For multi-word queries, penalize low overlap heavily:
        // 1 of 3 words = ratio 0.33 → score ~17 (barely visible)
        // 2 of 3 words = ratio 0.67 → score ~133 (moderate)
        // 1 of 2 words = ratio 0.50 → score ~75
        score += Math.round(partialRatio * partialRatio * 300);
      }
    }

    // If score is still 0, check aliases alone for full match
    if (score === 0) {
      const aliasMatch = aliases.some(a => {
        const aLower = a.toLowerCase();
        const aWords = aLower.split(/[\s,()[\]\-/]+/).filter(w => w.length > 1);
        return queryWords.every(qw => aWords.some(aw => aw.includes(qw) || qw.includes(aw)));
      });
      if (aliasMatch) score += 400;
    }
  }

  // No match at all
  if (score === 0) return 0;

  // Bonus: Word order in name matches query order
  if (queryWords.length >= 2) {
    let lastIndex = -1;
    let ordered = true;
    for (const qw of queryWords) {
      const idx = nameWords.findIndex((nw, i) => i > lastIndex && (nw.includes(qw) || qw.includes(nw)));
      if (idx === -1 || idx <= lastIndex) { ordered = false; break; }
      lastIndex = idx;
    }
    if (ordered) score += 50;
  }

  // Penalty: Excess words in name that aren't in query (reduces noise from very long names)
  const extraWords = nameWords.filter(nw =>
    !queryWords.some(qw => nw.includes(qw) || qw.includes(nw))
  ).length;
  score -= extraWords * 10;

  // Multi-word query penalty: suppress results matching fewer than half the query words
  if (queryWords.length >= 3) {
    const matchingWords = queryWords.filter(qw =>
      nameWords.some(nw => nw.includes(qw) || qw.includes(nw))
    );
    const aliasText = aliases.join(" ").toLowerCase();
    const aliasWords = aliasText.split(/[\s,()[\]\-/]+/).filter(w => w.length > 1);
    const totalMatchingWords = queryWords.filter(qw =>
      nameWords.some(nw => nw.includes(qw) || qw.includes(nw)) ||
      aliasWords.some(aw => aw.includes(qw) || qw.includes(aw))
    );
    const matchRatio = totalMatchingWords.length / queryWords.length;

    if (matchRatio < 0.5) {
      score = Math.floor(score * 0.1);
    } else if (matchRatio < 0.75) {
      score = Math.floor(score * 0.4);
    }
  }

  return Math.max(score, 1); // floor at 1 if matched at all
}

/**
 * Apply a source priority bonus so curated foods rank above generic API results.
 * Common (curated) > NYC (curated) > USDA (baseline) > Open Food Facts (lower quality).
 */
export function applySourceBonus(score: number, source: string): number {
  if (score === 0) return 0;
  switch (source) {
    case "common":        return score + 200;
    case "nyc":           return score + 150;
    case "usda":          return score + 0;
    case "openfoodfacts": return score - 50;
    default:              return score;
  }
}

export interface ScoredResult {
  id: string;
  name: string;
  score: number;
  [key: string]: unknown;
}

/**
 * Deduplicate search results by normalized name.
 * Keeps the higher-scored entry when duplicates are found.
 */
export function deduplicateByName<T extends ScoredResult>(results: T[]): T[] {
  const seen = new Map<string, T>();

  for (const result of results) {
    const normalized = result.name
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const existing = seen.get(normalized);
    if (!existing || result.score > existing.score) {
      seen.set(normalized, result);
    }
  }

  return Array.from(seen.values());
}

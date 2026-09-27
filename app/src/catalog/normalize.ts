/**
 * Ingredient Normalization Pipeline
 *
 * Per blueprint §7.5:
 * 1. Lowercase all ingredient strings
 * 2. Trim whitespace, parentheses, trailing punctuation
 * 3. Resolve aliases via the ingredient_concerns lookup table
 * 4. Flag unmatched ingredients (preserved in record, do not participate in matching)
 * 5. Record unmatched count per product
 * 6. If unmatched > 30% of the list → mark partial_data and auto-cap allergy factor at insufficient_data
 */

export interface IngredientConcern {
  ingredient_name: string;
  aliases: string[];
}

export interface NormalizationResult {
  ingredients_normalized: string[];
  unmatched_count: number;
  partial_data: boolean;
  unmatched_ingredients: string[];
}

/**
 * Splits a raw ingredient string into individual ingredients.
 * Handles commas inside parentheses by tracking paren depth.
 */
export function splitIngredients(raw: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += char;
    } else if (char === ',' && parenDepth === 0 && (i === raw.length - 1 || /\s/.test(raw[i + 1]))) {
      // Split on comma only at top level (not inside parentheses) and only
      // when it separates items (followed by whitespace or end of string).
      // This keeps single INCI names like "1,2-Hexanediol" intact.
      const trimmed = current.trim();
      if (trimmed) result.push(trimmed);
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last ingredient
  const trimmed = current.trim();
  if (trimmed) result.push(trimmed);

  return result;
}

/**
 * Normalizes a single ingredient string:
 * - Lowercase
 * - Trim whitespace
 * - Remove trailing punctuation (.,;)
 * - Remove parenthetical content (e.g., "Water (Aqua)" -> "Water")
 */
export function normalizeIngredientString(ingredient: string): string {
  let normalized = ingredient.toLowerCase().trim();

  // Remove parenthetical content (e.g., "(Aqua)", "(5%)")
  normalized = normalized.replace(/\([^)]*\)/g, '').trim();

  // Remove concentration tokens (e.g., "benzoyl peroxide 5.5%" -> "benzoyl peroxide")
  // so actives match the lookup table instead of missing silently.
  normalized = normalized.replace(/\b\d+(\.\d+)?\s*%/g, '').trim();

  // Remove trailing punctuation
  normalized = normalized.replace(/[.,;]+$/, '').trim();

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Builds a lookup map from alias -> canonical ingredient_name
 * for fast alias resolution during normalization.
 */
export function buildAliasMap(concerns: IngredientConcern[]): Map<string, string> {
  const aliasMap = new Map<string, string>();

  for (const concern of concerns) {
    const canonical = concern.ingredient_name.toLowerCase().trim();
    // Map canonical to itself
    aliasMap.set(canonical, canonical);
    // Map each alias to canonical
    for (const alias of concern.aliases) {
      const normalizedAlias = alias.toLowerCase().trim();
      aliasMap.set(normalizedAlias, canonical);
    }
  }

  return aliasMap;
}

/**
 * Main normalization function.
 * Takes raw ingredient strings and ingredient_concerns lookup table,
 * returns normalized ingredients with metadata.
 */
export function normalizeIngredients(
  rawIngredients: string[],
  concerns: IngredientConcern[]
): NormalizationResult {
  const aliasMap = buildAliasMap(concerns);
  const normalized: string[] = [];
  const unmatched: string[] = [];

  for (const raw of rawIngredients) {
    const cleaned = normalizeIngredientString(raw);

    if (!cleaned) continue; // Skip empty after cleaning

    // Try to resolve via alias map
    const canonical = aliasMap.get(cleaned);

    if (canonical) {
      normalized.push(canonical);
    } else {
      // Unmatched: preserve original cleaned form for audit
      normalized.push(cleaned);
      unmatched.push(cleaned);
    }
  }

  const unmatchedCount = unmatched.length;
  const totalCount = normalized.length;
  const partialData = totalCount === 0 || unmatchedCount / totalCount > 0.3;

  return {
    ingredients_normalized: normalized,
    unmatched_count: unmatchedCount,
    partial_data: partialData,
    unmatched_ingredients: unmatched,
  };
}

/**
 * Convenience function: split raw string then normalize.
 */
export function normalizeFromRawString(
  rawString: string,
  concerns: IngredientConcern[]
): NormalizationResult {
  const split = splitIngredients(rawString);
  return normalizeIngredients(split, concerns);
}

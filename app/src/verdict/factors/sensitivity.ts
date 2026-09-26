import { Profile, Product, FactorState } from '../types';

/**
 * Ingredient concern entry from the lookup table (blueprint §7.2).
 * Only the fields needed for sensitivity evaluation are included here.
 */
export interface IngredientConcern {
  ingredient_name: string;
  aliases: string[];
  is_sensitivity_flag: boolean;
}

/**
 * Evaluates the sensitivity factor.
 *
 * This is a hard constraint factor (blueprint §6.2). It checks whether any
 * of the user's declared sensitivities match a product ingredient that is
 * flagged as a sensitivity concern in the ingredient lookup table.
 *
 * Returns one of:
 * - 'pass' — no declared sensitivity matches a flagged ingredient
 * - 'caution' — at least one declared sensitivity matches an ingredient
 *               with is_sensitivity_flag === true
 * - 'insufficient_data' — ingredient list is incomplete (product.partial_data === true)
 *
 * Note: 'fail' is not a valid state for this factor per blueprint §6.3.
 *
 * Comparison is case-insensitive and whitespace-trimmed on the sensitivity side,
 * matching against the already-normalized `ingredients_normalized` array.
 * Aliases from the ingredient_concerns table are also considered.
 */
export function evaluateSensitivity(
  profile: Profile,
  product: Product,
  ingredientConcerns: IngredientConcern[] = []
): FactorState {
  // Build a set of ingredient names (canonical + aliases) that have
  // is_sensitivity_flag === true, for fast lookup.
  // Also build a map from alias → canonical name for alias resolution.
  // All stored in lowercase for case-insensitive matching.
  const flaggedIngredients = new Set<string>();
  const aliasToCanonical = new Map<string, string>();
  for (const concern of ingredientConcerns) {
    if (concern.is_sensitivity_flag) {
      const canonical = concern.ingredient_name.toLowerCase();
      flaggedIngredients.add(canonical);
      for (const alias of concern.aliases) {
        const normalizedAlias = alias.toLowerCase();
        flaggedIngredients.add(normalizedAlias);
        aliasToCanonical.set(normalizedAlias, canonical);
      }
    }
  }

  // Normalize user sensitivities: lowercase + trim for comparison.
  // The product's ingredients_normalized is already normalized per §7.5.
  const normalizedSensitivities = profile.sensitivities.map((s) =>
    s.toLowerCase().trim()
  );

  // A detected sensitivity conflict overrides insufficient-data handling:
  // missing evidence must not hide a known match.
  const hasConflict = normalizedSensitivities.some((sensitivity) => {
    if (product.ingredients_normalized.includes(sensitivity)) {
      if (flaggedIngredients.has(sensitivity)) return true;
    }
    const canonical = aliasToCanonical.get(sensitivity);
    if (canonical && product.ingredients_normalized.includes(canonical)) return true;
    return false;
  });
  if (hasConflict) return 'caution';

  // If the product's ingredient data is incomplete, we cannot fully verify.
  // Per blueprint §6.3 and §7.5, partial_data caps this factor at insufficient_data.
  if (product.partial_data) {
    return 'insufficient_data';
  }

  // If the user has no declared sensitivities, there's nothing to flag.
  if (!profile.sensitivities || profile.sensitivities.length === 0) {
    return 'pass';
  }

  // No flagged sensitivity ingredients found in a complete ingredient list.
  return 'pass';
}
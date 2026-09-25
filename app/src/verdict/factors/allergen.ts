import { Profile, Product, FactorState } from '../types';

/**
 * Evaluates the declared-allergen conflict factor.
 *
 * This is a hard constraint factor (blueprint §6.2). It checks whether any
 * of the user's declared allergens appear in the product's normalized
 * ingredient list.
 *
 * Returns one of:
 * - 'pass' — no declared allergen matches any ingredient
 * - 'fail' — at least one declared allergen matches an ingredient
 * - 'insufficient_data' — ingredient list is incomplete (product.partial_data === true)
 *
 * Note: 'caution' is not a valid state for this factor per blueprint §6.3.
 *
 * Comparison is case-insensitive and whitespace-trimmed on the allergen side,
 * matching against the already-normalized `ingredients_normalized` array.
 */
export function evaluateDeclaredAllergenConflict(
  profile: Profile,
  product: Product
): FactorState {
  // If the product's ingredient data is incomplete, we cannot fully verify.
  // Per blueprint §6.7 and §7.5, partial_data caps this factor at insufficient_data.
  // This check comes first because even with no declared allergies, we cannot
  // confirm the ingredient list is complete.
  if (product.partial_data) {
    return 'insufficient_data';
  }

  // If the user has no declared allergies, there's nothing to conflict.
  if (!profile.allergies || profile.allergies.length === 0) {
    return 'pass';
  }

  // Normalize user allergens: lowercase + trim for comparison.
  // The product's ingredients_normalized is already normalized per §7.5.
  const normalizedAllergens = profile.allergies.map((a) =>
    a.toLowerCase().trim()
  );

  // Check each normalized allergen against the product's normalized ingredients.
  for (const allergen of normalizedAllergens) {
    if (product.ingredients_normalized.includes(allergen)) {
      return 'fail';
    }
  }

  // No matches found in a complete ingredient list.
  return 'pass';
}
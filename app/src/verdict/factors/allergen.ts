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
  product: Product,
  concerns: ReadonlyArray<{ ingredient_name: string; aliases: string[] }> = []
): FactorState {
  const aliases = new Map<string, string>();
  for (const entry of concerns) {
    const name = entry.ingredient_name.toLowerCase().trim();
    aliases.set(name, name);
  }
  for (const entry of concerns) {
    for (const alias of entry.aliases) {
      const key = alias.toLowerCase().trim();
      if (!aliases.has(key)) aliases.set(key, entry.ingredient_name.toLowerCase().trim());
    }
  }
  const canonical = (name: string) => aliases.get(name.toLowerCase().trim()) ?? name.toLowerCase().trim();
  const ingredients = new Set(product.ingredients_normalized.map(canonical));
  // Blueprint §6.5 step 1 precedes step 2: a detected conflict overrides
  // insufficient-data handling. Missing evidence must not hide a known match.
  if (profile.allergies.some((allergen) => ingredients.has(canonical(allergen)))) return 'fail';
  if (product.partial_data || ingredients.size === 0) return 'insufficient_data';

  // If the user has no declared allergies, there's nothing to conflict.
  if (!profile.allergies || profile.allergies.length === 0) {
    return 'pass';
  }

  // No matches found in a complete ingredient list.
  return 'pass';
}

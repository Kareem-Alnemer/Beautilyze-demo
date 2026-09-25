import { Profile, Product, FactorState } from '../types';

/**
 * Ingredient concern entry from the lookup table (blueprint §7.2).
 * Fields needed for acne-concern fit evaluation.
 */
export interface IngredientConcern {
  ingredient_name: string;
  aliases: string[];
  helps_with: string[];
  is_strong_active: boolean;
  is_barrier_support: boolean;
}

/**
 * Evaluates the acne-concern fit compatibility factor.
 *
 * This is a compatibility factor (blueprint §6.2). It checks whether the
 * product addresses the user's acne severity with appropriate ingredients.
 *
 * Returns one of:
 * - 'pass' — product meets the severity-specific criteria
 * - 'caution' — product neutral (no acne concern tag) OR severe with incomplete data (degraded)
 * - 'fail' — product claims to address acne but lacks required ingredients for severity
 * - 'insufficient_data' — user's acne severity not set
 *
 * Per blueprint §6.3 table and §6.4 mapping.
 */
export function evaluateAcneFit(
  profile: Profile,
  product: Product,
  ingredientConcerns: IngredientConcern[] = []
): FactorState {
  // If user hasn't set their acne severity, we cannot evaluate.
  if (profile.user_acne_severity === null) {
    return 'insufficient_data';
  }

  // If product has no acne concern tag, it's neutral for all severities.
  const hasAcneTag = product.concern_tags.includes('acne');
  const hasOilControlTag = product.concern_tags.includes('oil_control');

  if (!hasAcneTag) {
    // Mild also accepts oil_control as pass (per §6.4 table)
    if (profile.user_acne_severity === 'mild' && hasOilControlTag) {
      return 'pass';
    }
    return 'caution';
  }

  // Build lookup sets for ingredient checks (case-insensitive, with aliases).
  const helpsWithAcne = new Set<string>();
  const strongActives = new Set<string>();
  const barrierSupport = new Set<string>();

  for (const concern of ingredientConcerns) {
    const canonical = concern.ingredient_name.toLowerCase();
    const allNames = [canonical, ...concern.aliases.map((a) => a.toLowerCase())];

    if (concern.helps_with.includes('acne')) {
      for (const name of allNames) {
        helpsWithAcne.add(name);
      }
    }
    if (concern.is_strong_active) {
      for (const name of allNames) {
        strongActives.add(name);
      }
    }
    if (concern.is_barrier_support) {
      for (const name of allNames) {
        barrierSupport.add(name);
      }
    }
  }

  // Check if product has at least one ingredient helping with acne.
  const hasHelpsWithAcne = product.ingredients_normalized.some((ing) =>
    helpsWithAcne.has(ing.toLowerCase())
  );

  // Check for strong actives and barrier support (for severe).
  const hasStrongActive = product.ingredients_normalized.some((ing) =>
    strongActives.has(ing.toLowerCase())
  );
  const hasBarrierSupport = product.ingredients_normalized.some((ing) =>
    barrierSupport.has(ing.toLowerCase())
  );

  const severity = profile.user_acne_severity;

  // Mild: pass if acne tag OR oil_control tag (already handled above).
  if (severity === 'mild') {
    return 'pass';
  }

  // Moderate: pass if acne tag AND at least one helps_with_acne ingredient.
  if (severity === 'moderate') {
    if (hasHelpsWithAcne) {
      return 'pass';
    }
    // Has acne tag but no helping ingredient.
    return 'fail';
  }

  // Severe: strict rule — needs helps_with_acne AND strong_active AND barrier_support.
  // If partial_data, degrade to moderate rule and cap at caution.
  if (severity === 'severe') {
    if (product.partial_data) {
      // Degrade to moderate rule per §6.4 note.
      if (hasHelpsWithAcne) {
        return 'caution'; // capped
      }
      return 'caution'; // capped (moderate would be fail, but severe degrades to caution cap)
    }

    if (hasHelpsWithAcne && hasStrongActive && hasBarrierSupport) {
      return 'pass';
    }

    // Has acne tag but missing strong_active or barrier_support.
    return 'fail';
  }

  // Should not reach here (exhaustive AcneSeverity), but default to caution.
  return 'caution';
}
import {
  Profile,
  Product,
  Verdict,
  FactorState,
  FactorResult,
  HardConstraintResult,
  CompatibilityFactors,
  VerdictValue,
} from './types';
import { evaluateDeclaredAllergenConflict } from './factors/allergen';
import { evaluateSensitivity } from './factors/sensitivity';
import { evaluateSkinTypeFit } from './factors/skinTypeFit';
import { evaluateAcneFit } from './factors/acneFit';
import { evaluateAgeFit } from './factors/ageFit';
import { applyPrecedence, FactorStates } from './precedence';
import { computeScore, CompatibilityScore } from './score';

/**
 * Unified ingredient concern type for the public API.
 * Combines fields needed by both sensitivity and acne factors.
 */
export interface IngredientConcern {
  ingredient_name: string;
  aliases: string[];
  is_sensitivity_flag: boolean;
  helps_with: string[];
  is_strong_active: boolean;
  is_barrier_support: boolean;
}

/**
 * Generates a human-readable reason for a factor result.
 * Per blueprint §6.8: each reason must name:
 * 1. The user attribute that triggered the rule
 * 2. The product/ingredient attribute that triggered the rule
 * 3. The rule that connected them
 */
function generateReason(
  factorName: string,
  state: FactorState,
  profile: Profile,
  product: Product,
  _ingredientConcerns: IngredientConcern[]
): string {
  switch (factorName) {
    case 'declared_allergen_conflict': {
      if (state === 'insufficient_data') {
        return "We couldn't fully verify this product's ingredients for allergen conflicts.";
      }
      if (state === 'fail') {
        const matchedAllergen = profile.allergies.find((a) =>
          product.ingredients_normalized.includes(a.toLowerCase().trim())
        );
        return `Contains ${matchedAllergen}, which you flagged as an allergy.`;
      }
      return 'No allergen conflicts identified in available ingredient data.';
    }

    case 'sensitivity': {
      if (state === 'insufficient_data') {
        return "We couldn't fully verify this product's ingredients for sensitivity concerns.";
      }
      if (state === 'caution') {
        const matchedSensitivity = profile.sensitivities.find((s) => {
          const normalized = s.toLowerCase().trim();
          return product.ingredients_normalized.includes(normalized);
        });
        const ingredient = matchedSensitivity || 'a flagged ingredient';
        return `Contains ${ingredient}, which may irritate sensitive skin.`;
      }
      return 'No sensitivity concerns identified in available ingredient data.';
    }

    case 'skin_type_fit': {
      if (state === 'insufficient_data') {
        return 'Your skin type is not set, so we could not check skin-type fit.';
      }
      if (state === 'pass') {
        return `Product is tagged for your skin type (${profile.user_skin_type}).`;
      }
      if (state === 'fail') {
        return `Product is tagged for ${product.skin_type_tags.join(', ')} skin, not your skin type (${profile.user_skin_type}).`;
      }
      return 'Product has no skin-type suitability tags (neutral).';
    }

    case 'acne_fit': {
      if (state === 'insufficient_data') {
        return 'Your acne severity is not set, so we could not check acne-concern fit.';
      }
      if (state === 'pass') {
        if (profile.user_acne_severity === 'mild') {
          return 'Product addresses acne or oil control for mild acne.';
        }
        if (profile.user_acne_severity === 'moderate') {
          return 'Product contains ingredients that help with acne for moderate acne.';
        }
        return 'Product contains acne-fighting actives and barrier support for severe acne.';
      }
      if (state === 'fail') {
        if (profile.user_acne_severity === 'moderate') {
          return 'Product claims to address acne but lacks acne-helping ingredients for moderate acne.';
        }
        return 'Product claims to address acne but lacks required actives and/or barrier support for severe acne.';
      }
      return 'Product does not claim to address acne (neutral).';
    }

    case 'age_fit': {
      if (state === 'insufficient_data') {
        return 'Your age is not set, so we could not check age suitability.';
      }
      if (state === 'pass') {
        return 'Product has no age restrictions, or your age falls within the recommended range.';
      }
      if (state === 'fail') {
        return 'Product has a strong age restriction that you fall outside of.';
      }
      return 'Product has an age-related note (advisory).';
    }

    default:
      return '';
  }
}

/**
 * Generates a one-sentence plain-language summary of the verdict.
 * Per blueprint §6.8 and terminology discipline §10.2.
 */
function generateSummary(
  verdict: VerdictValue,
  score: CompatibilityScore,
  hardConstraints: HardConstraintResult[],
  _compatFactors: FactorResult[]
): string {
  const parts: string[] = [];

  if (verdict === 'match') {
    parts.push('This product matches the factors BeautiLyze checks.');
  } else if (verdict === 'caution') {
    parts.push('This product has some concerns you should review.');
  } else {
    parts.push('This product does not match the factors BeautiLyze checks.');
  }

  // Add compatibility factor summary
  if (score.passed > 0) {
    parts.push(`${score.passed} of ${score.total} compatibility factors matched.`);
  } else {
    parts.push('No compatibility factors matched.');
  }

  // Add hard constraint flags
  const flaggedConstraints = hardConstraints.filter((hc) => hc.result !== 'pass');
  if (flaggedConstraints.length > 0) {
    const constraintNames = flaggedConstraints.map((hc) => hc.name.replace('_', ' ')).join(' and ');
    parts.push(`${constraintNames} flagged.`);
  }

  return parts.join(' ');
}

/**
 * Main verdict evaluation entry point.
 *
 * Evaluates a product against a user profile using the deterministic
 * verdict engine (blueprint §6).
 *
 * @param profile - User profile (uses user_* fields, not AI fields)
 * @param product - Product record from catalog
 * @param ingredientConcerns - Ingredient lookup table rows (from ingredient_concerns)
 * @returns Complete Verdict object with verdict, score, factor breakdown, summary, and disclaimer
 */
export function evaluate(
  profile: Profile,
  product: Product,
  ingredientConcerns: IngredientConcern[] = []
): Verdict {
  // Run all five factors
  const allergenState = evaluateDeclaredAllergenConflict(profile, product);
  const sensitivityState = evaluateSensitivity(profile, product, ingredientConcerns);
  const skinTypeFitState = evaluateSkinTypeFit(profile, product);
  const acneFitState = evaluateAcneFit(profile, product, ingredientConcerns);
  const ageFitState = evaluateAgeFit(profile, product);

  // Collect factor states for precedence
  const factorStates: FactorStates = {
    declaredAllergenConflict: allergenState,
    sensitivity: sensitivityState,
    skinTypeFit: skinTypeFitState,
    acneFit: acneFitState,
    ageFit: ageFitState,
  };

  // Apply precedence rule to get final verdict
  const verdict = applyPrecedence(factorStates);

  // Compute compatibility score
  const compatFactorsArray: FactorState[] = [skinTypeFitState, acneFitState, ageFitState];
  const score = computeScore(compatFactorsArray);

  // Build hard constraints array
  const hardConstraints: HardConstraintResult[] = [
    {
      name: 'declared_allergen_conflict',
      result: allergenState,
      reason: generateReason('declared_allergen_conflict', allergenState, profile, product, ingredientConcerns),
    },
    {
      name: 'sensitivity',
      result: sensitivityState,
      reason: generateReason('sensitivity', sensitivityState, profile, product, ingredientConcerns),
    },
  ];

  // Build compatibility factors array
  const compatibilityFactors: CompatibilityFactors = [
    {
      name: 'skin_type_fit',
      result: skinTypeFitState,
      reason: generateReason('skin_type_fit', skinTypeFitState, profile, product, ingredientConcerns),
    },
    {
      name: 'acne_fit',
      result: acneFitState,
      reason: generateReason('acne_fit', acneFitState, profile, product, ingredientConcerns),
    },
    {
      name: 'age_fit',
      result: ageFitState,
      reason: generateReason('age_fit', ageFitState, profile, product, ingredientConcerns),
    },
  ];

  // Generate summary
  const summary = generateSummary(verdict, score, hardConstraints, compatibilityFactors);

  return {
    verdict,
    score,
    hard_constraints: hardConstraints,
    compatibility_factors: compatibilityFactors,
    summary,
    disclaimer_shown: true,
  };
}

// Re-export types and factor functions for testing
export * from './types';
export * from './factors/allergen';
export * from './factors/sensitivity';
export * from './factors/skinTypeFit';
export * from './factors/acneFit';
export * from './factors/ageFit';
export * from './precedence';
export * from './score';
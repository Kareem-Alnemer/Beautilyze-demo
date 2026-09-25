import { FactorState } from './types';

/**
 * Compatibility score result.
 * Per blueprint §6.6: score counts compatibility factors only (3 total).
 * Hard constraints are shown separately.
 */
export interface CompatibilityScore {
  label: 'Compatibility factors';
  passed: number;
  total: 3;
}

/**
 * Computes the compatibility score from the three compatibility factor states.
 *
 * Per blueprint §6.6:
 * - Only compatibility factors (skin_type_fit, acne_fit, age_fit) are counted
 * - Only 'pass' states count as passed
 * - 'caution', 'fail', 'insufficient_data' all count as 0 passed
 * - Total is always 3
 *
 * @param compatFactors Array of 3 factor states in order: [skinTypeFit, acneFit, ageFit]
 * @returns CompatibilityScore object
 */
export function computeScore(compatFactors: FactorState[]): CompatibilityScore {
  if (compatFactors.length !== 3) {
    throw new Error('Expected exactly 3 compatibility factors');
  }

  let passed = 0;
  for (const factor of compatFactors) {
    if (factor === 'pass') {
      passed++;
    }
  }

  return {
    label: 'Compatibility factors',
    passed,
    total: 3,
  };
}
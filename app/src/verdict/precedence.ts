import { FactorState, VerdictValue } from './types';

/**
 * Input for precedence evaluation.
 * Contains the state of all five factors.
 */
export interface FactorStates {
  declaredAllergenConflict: FactorState;
  sensitivity: FactorState;
  skinTypeFit: FactorState;
  acneFit: FactorState;
  ageFit: FactorState;
}

/**
 * Applies the deterministic precedence rule (blueprint §6.5).
 *
 * Precedence chain:
 * 1. If declared_allergen_conflict == FAIL          → MISMATCH
 * 2. Else if declared_allergen_conflict == INSUFFICIENT → CAUTION (with warning)
 * 3. Else if sensitivity == FAIL                    → MISMATCH
 * 4. Else if sensitivity == CAUTION                 → CAUTION (cannot upgrade)
 * 5. Else compute pass count across compatibility factors:
 *      3 pass → MATCH
 *      2 pass → CAUTION
 *      0–1 pass → MISMATCH
 *    INSUFFICIENT factors count as neither pass nor fail,
 *    but their presence caps the verdict at CAUTION.
 *
 * @returns Final verdict value
 */
export function applyPrecedence(states: FactorStates): VerdictValue {
  // Step 1: Declared allergen conflict FAIL → MISMATCH (overrides everything)
  if (states.declaredAllergenConflict === 'fail') {
    return 'mismatch';
  }

  // Step 2: Declared allergen conflict INSUFFICIENT_DATA → CAUTION (capped)
  if (states.declaredAllergenConflict === 'insufficient_data') {
    return 'caution';
  }

  // Step 3: Sensitivity FAIL → MISMATCH
  // Note: sensitivity factor never returns 'fail' per blueprint §6.3,
  // but we handle it defensively.
  if (states.sensitivity === 'fail') {
    return 'mismatch';
  }

  // Step 4: Sensitivity CAUTION → CAUTION (cannot upgrade)
  if (states.sensitivity === 'caution') {
    return 'caution';
  }

  // Step 5: Evaluate compatibility factors
  const compatFactors = [
    states.skinTypeFit,
    states.acneFit,
    states.ageFit,
  ];

  // Count passes
  let passCount = 0;
  let hasInsufficient = false;

  for (const factor of compatFactors) {
    if (factor === 'pass') {
      passCount++;
    } else if (factor === 'insufficient_data') {
      hasInsufficient = true;
    }
  }

  // Determine base verdict from pass count
  let verdict: VerdictValue;
  if (passCount === 3) {
    verdict = 'match';
  } else if (passCount === 2) {
    verdict = 'caution';
  } else {
    verdict = 'mismatch';
  }

  // Cap at CAUTION if any compatibility factor has insufficient data
  // Per blueprint §6.5: "Factors in INSUFFICIENT state count as neither pass nor fail,
  // but their presence caps the verdict at CAUTION."
  if (hasInsufficient && verdict !== 'caution') {
    return 'caution';
  }

  return verdict;
}
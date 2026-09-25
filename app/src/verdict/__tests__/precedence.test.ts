import { applyPrecedence, FactorStates } from '../precedence';
import { FactorState } from '../types';

describe('applyPrecedence', () => {
  const baseStates: FactorStates = {
    declaredAllergenConflict: 'pass',
    sensitivity: 'pass',
    skinTypeFit: 'pass',
    acneFit: 'pass',
    ageFit: 'pass',
  };

  // --- Step 1: Allergen FAIL → MISMATCH ---
  it('returns mismatch when allergen conflict is fail (overrides all)', () => {
    const states = { ...baseStates, declaredAllergenConflict: 'fail' as FactorState };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  it('returns mismatch when allergen fail even if all compat factors pass', () => {
    const states = {
      ...baseStates,
      declaredAllergenConflict: 'fail' as FactorState,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  it('returns mismatch when allergen fail even if sensitivity caution', () => {
    const states = {
      ...baseStates,
      declaredAllergenConflict: 'fail' as FactorState,
      sensitivity: 'caution' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  // --- Step 2: Allergen INSUFFICIENT_DATA → CAUTION ---
  it('returns caution when allergen conflict is insufficient_data', () => {
    const states = { ...baseStates, declaredAllergenConflict: 'insufficient_data' as FactorState };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when allergen insufficient even if all compat factors pass', () => {
    const states = {
      ...baseStates,
      declaredAllergenConflict: 'insufficient_data' as FactorState,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when allergen insufficient even if sensitivity pass', () => {
    const states = {
      ...baseStates,
      declaredAllergenConflict: 'insufficient_data' as FactorState,
      sensitivity: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  // --- Step 3: Sensitivity FAIL → MISMATCH (defensive) ---
  it('returns mismatch when sensitivity is fail (defensive)', () => {
    const states = { ...baseStates, sensitivity: 'fail' as FactorState };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  // --- Step 4: Sensitivity CAUTION → CAUTION ---
  it('returns caution when sensitivity is caution', () => {
    const states = { ...baseStates, sensitivity: 'caution' as FactorState };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when sensitivity caution even if all compat factors pass', () => {
    const states = {
      ...baseStates,
      sensitivity: 'caution' as FactorState,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when sensitivity caution overrides compat match', () => {
    const states = {
      ...baseStates,
      sensitivity: 'caution' as FactorState,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  // --- Step 5: Compatibility factor aggregation ---
  it('returns match when all 3 compat factors pass', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('match');
  });

  it('returns caution when 2 compat factors pass', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'fail' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when 2 compat factors pass (different combo)', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'fail' as FactorState,
      ageFit: 'pass' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns mismatch when 1 compat factor passes', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'fail' as FactorState,
      ageFit: 'fail' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  it('returns mismatch when 0 compat factors pass', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'fail' as FactorState,
      acneFit: 'fail' as FactorState,
      ageFit: 'fail' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  // --- INSUFFICIENT_DATA in compat factors caps at CAUTION ---
  it('returns caution when 3 pass but one compat is insufficient_data', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'insufficient_data' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when 2 pass but one compat is insufficient_data', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'pass' as FactorState,
      ageFit: 'insufficient_data' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when 1 pass and one compat is insufficient_data (capped at CAUTION)', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'fail' as FactorState,
      ageFit: 'insufficient_data' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when all 3 compat are insufficient_data', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'insufficient_data' as FactorState,
      acneFit: 'insufficient_data' as FactorState,
      ageFit: 'insufficient_data' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  it('returns caution when 2 insufficient_data and 1 pass', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'insufficient_data' as FactorState,
      ageFit: 'insufficient_data' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  // --- Caution/insufficient in compat factors don't count as pass ---
  it('returns mismatch when 1 pass, 1 caution, 1 fail (0-1 pass = mismatch)', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'caution' as FactorState,
      ageFit: 'fail' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  it('returns mismatch when 1 pass, 2 caution (0-1 pass = mismatch)', () => {
    const states = {
      ...baseStates,
      skinTypeFit: 'pass' as FactorState,
      acneFit: 'caution' as FactorState,
      ageFit: 'caution' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });

  // --- Precedence order: allergen insufficient > sensitivity caution ---
  it('returns caution when allergen insufficient AND sensitivity caution (allergen wins)', () => {
    const states = {
      ...baseStates,
      declaredAllergenConflict: 'insufficient_data' as FactorState,
      sensitivity: 'caution' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('caution');
  });

  // --- Precedence order: allergen fail > sensitivity caution ---
  it('returns mismatch when allergen fail AND sensitivity caution (allergen wins)', () => {
    const states = {
      ...baseStates,
      declaredAllergenConflict: 'fail' as FactorState,
      sensitivity: 'caution' as FactorState,
    };
    const result = applyPrecedence(states);
    expect(result).toBe('mismatch');
  });
});
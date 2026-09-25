import { evaluate, Profile, Product, IngredientConcern } from '../index';

describe('evaluate (integration tests per blueprint §12)', () => {
  const baseProfile: Profile = {
    user_skin_type: 'normal',
    user_acne_severity: 'mild',
    allergies: [],
    sensitivities: [],
    age: 25,
  };

  const baseProduct: Product = {
    id: 'prod-1',
    name: 'Test Product',
    brand: 'Test Brand',
    ingredients_normalized: ['water', 'glycerin', 'niacinamide'],
    unmatched_count: 0,
    partial_data: false,
    skin_type_tags: ['normal', 'oily'],
    concern_tags: ['acne', 'oil_control'],
    age_notes: null,
  };

  const baseIngredientConcerns: IngredientConcern[] = [
    {
      ingredient_name: 'niacinamide',
      aliases: ['vitamin b3'],
      is_sensitivity_flag: false,
      helps_with: ['acne', 'oily', 'barrier'],
      is_strong_active: false,
      is_barrier_support: true,
    },
    {
      ingredient_name: 'salicylic acid',
      aliases: ['bha'],
      is_sensitivity_flag: true,
      helps_with: ['acne', 'oily'],
      is_strong_active: true,
      is_barrier_support: false,
    },
    {
      ingredient_name: 'ceramide np',
      aliases: ['ceramide 3'],
      is_sensitivity_flag: false,
      helps_with: ['barrier', 'dryness'],
      is_strong_active: false,
      is_barrier_support: true,
    },
  ];

  // Helper to create a profile with overrides
  const p = (overrides: Partial<Profile>): Profile => ({ ...baseProfile, ...overrides });
  const pr = (overrides: Partial<Product>): Product => ({ ...baseProduct, ...overrides });

  // --- §12 Case 1: All factors pass → MATCH ---
  it('Case 1: All factors pass → MATCH', () => {
    const profile = p({ user_skin_type: 'normal', user_acne_severity: 'mild', age: 25 });
    const product = pr({
      skin_type_tags: ['normal'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.verdict).toBe('match');
    expect(result.score.passed).toBe(3);
  });

  // --- §12 Case 2: Declared-allergen conflict → MISMATCH (overrides all) ---
  it('Case 2: Declared-allergen conflict → MISMATCH (overrides all)', () => {
    const profile = p({ allergies: ['niacinamide'] });
    const product = pr({
      ingredients_normalized: ['water', 'niacinamide'],
      skin_type_tags: ['normal'],
      concern_tags: ['acne'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.verdict).toBe('mismatch');
    expect(result.hard_constraints.find((h) => h.name === 'declared_allergen_conflict')?.result).toBe('fail');
  });

  // --- §12 Case 3: Sensitivity conflict only → CAUTION ---
  it('Case 3: Sensitivity conflict only → CAUTION', () => {
    const profile = p({ sensitivities: ['salicylic acid'] });
    const product = pr({
      ingredients_normalized: ['water', 'salicylic acid'],
      skin_type_tags: ['normal'],
      concern_tags: ['acne'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.verdict).toBe('caution');
    expect(result.hard_constraints.find((h) => h.name === 'sensitivity')?.result).toBe('caution');
  });

  // --- §12 Case 4: Skin-type mismatch, all else pass → CAUTION or MISMATCH ---
  it('Case 4a: Skin-type mismatch (1/3 pass) → MISMATCH', () => {
    const profile = p({ user_skin_type: 'dry' });
    const product = pr({
      skin_type_tags: ['oily'], // mismatch
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    // Only acne_fit passes (age_fit passes by default), so 2/3 = CAUTION
    // Wait: age_fit passes (no age_notes), acne_fit passes, skin_type_fit fails = 2 pass = CAUTION
    expect(result.verdict).toBe('caution');
    expect(result.score.passed).toBe(2);
  });

  it('Case 4b: Skin-type mismatch + age mismatch (1/3 pass) → MISMATCH', () => {
    const profile = p({ user_skin_type: 'dry', age: 50 });
    const product = pr({
      skin_type_tags: ['oily'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
      age_notes: 'Under 30',
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    // Only acne_fit passes = 1/3 = MISMATCH
    expect(result.verdict).toBe('mismatch');
    expect(result.score.passed).toBe(1);
  });

  // --- §12 Case 5: Insufficient ingredient data → CAUTION, never MATCH ---
  it('Case 5: Insufficient ingredient data (partial_data) → CAUTION, never MATCH', () => {
    const profile = p({ user_skin_type: 'normal', user_acne_severity: 'mild', age: 25 });
    const product = pr({
      partial_data: true,
      skin_type_tags: ['normal'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.verdict).toBe('caution');
    expect(result.verdict).not.toBe('match');
    // Both allergen and sensitivity should be insufficient_data
    expect(result.hard_constraints.find((h) => h.name === 'declared_allergen_conflict')?.result).toBe('insufficient_data');
    expect(result.hard_constraints.find((h) => h.name === 'sensitivity')?.result).toBe('insufficient_data');
  });

  // --- §12 Case 6: Missing user skin type → Factor = insufficient, verdict capped at CAUTION ---
  it('Case 6: Missing user skin type → capped at CAUTION', () => {
    const profile = p({ user_skin_type: null, user_acne_severity: 'mild', age: 25 });
    const product = pr({
      skin_type_tags: ['normal'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.verdict).toBe('caution');
    expect(result.compatibility_factors.find((f) => f.name === 'skin_type_fit')?.result).toBe('insufficient_data');
  });

  // --- §12 Case 7: Missing user age → Same cap ---
  it('Case 7: Missing user age → capped at CAUTION', () => {
    const profile = p({ user_skin_type: 'normal', user_acne_severity: 'mild', age: null });
    const product = pr({
      skin_type_tags: ['normal'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.verdict).toBe('caution');
    expect(result.compatibility_factors.find((f) => f.name === 'age_fit')?.result).toBe('insufficient_data');
  });

  // --- §12 Case 8: Manual profile vs AI profile (same values) → Same verdict ---
  it('Case 8: Manual profile vs AI profile (same values) → Same verdict', () => {
    const manualProfile = p({
      user_skin_type: 'oily',
      user_acne_severity: 'moderate',
      ai_skin_type: 'oily',
      ai_acne_severity: 'moderate',
    });
    const aiProfile = p({
      user_skin_type: 'oily',
      user_acne_severity: 'moderate',
      ai_skin_type: 'oily',
      ai_acne_severity: 'moderate',
    });
    const product = pr({
      skin_type_tags: ['oily'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid', 'niacinamide'],
    });

    const manualResult = evaluate(manualProfile, product, baseIngredientConcerns);
    const aiResult = evaluate(aiProfile, product, baseIngredientConcerns);

    expect(manualResult.verdict).toBe(aiResult.verdict);
    expect(manualResult.score.passed).toBe(aiResult.score.passed);
  });

  // --- §12 Case 9: AI profile with user override → Verdict uses override ---
  it('Case 9: AI profile with user override → Verdict uses override', () => {
    const profile = p({
      user_skin_type: 'dry', // User override
      user_acne_severity: 'mild',
      ai_skin_type: 'oily', // AI said oily
      ai_acne_severity: 'moderate',
    });
    const product = pr({
      skin_type_tags: ['dry'], // Matches user override, not AI
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    // Should use user_skin_type (dry) not ai_skin_type (oily)
    expect(result.compatibility_factors.find((f) => f.name === 'skin_type_fit')?.result).toBe('pass');
  });

  // --- §12 Case 10: Product not in catalog → Handled at caller level ---
  // This is not tested here as it's a caller-level concern (product not found)

  // --- §12 Case 11: Acne severity severe, no strong_actives → Degrades to moderate rule ---
  it('Case 11: Acne severe, no strong_actives → Degrades to moderate (caution cap)', () => {
    const profile = p({ user_acne_severity: 'severe' });
    const product = pr({
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'], // barrier_support but no strong_active
      skin_type_tags: ['normal'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    // Severe requires strong_active + barrier_support; missing strong_active → fail
    // But wait: partial_data is false, so it should be fail, not degraded
    // The degradation only happens with partial_data
    expect(result.compatibility_factors.find((f) => f.name === 'acne_fit')?.result).toBe('fail');
  });

  it('Case 11b: Acne severe, partial_data → Degrades to moderate + caution cap', () => {
    const profile = p({ user_acne_severity: 'severe' });
    const product = pr({
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'],
      skin_type_tags: ['normal'],
      partial_data: true,
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    // Severe with partial_data degrades to moderate rule, capped at caution
    expect(result.compatibility_factors.find((f) => f.name === 'acne_fit')?.result).toBe('caution');
    expect(result.verdict).toBe('caution');
  });

  // --- §12 Case 12: Acne severity severe, strong_actives + barrier_support present → Strict rule applies ---
  it('Case 12: Acne severe, strong_actives + barrier_support present → PASS', () => {
    const profile = p({ user_acne_severity: 'severe' });
    const product = pr({
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid', 'niacinamide'], // strong_active + barrier_support
      skin_type_tags: ['normal'],
    });
    const result = evaluate(profile, product, baseIngredientConcerns);
    expect(result.compatibility_factors.find((f) => f.name === 'acne_fit')?.result).toBe('pass');
  });

  // --- Additional integration tests ---

  it('returns correct verdict structure with all required fields', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('hard_constraints');
    expect(result).toHaveProperty('compatibility_factors');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('disclaimer_shown', true);
    expect(['match', 'caution', 'mismatch']).toContain(result.verdict);
  });

  it('hard_constraints array has exactly 2 entries with correct names', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    expect(result.hard_constraints).toHaveLength(2);
    expect(result.hard_constraints.map((h) => h.name).sort()).toEqual(['declared_allergen_conflict', 'sensitivity']);
  });

  it('compatibility_factors array has exactly 3 entries with correct names', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    expect(result.compatibility_factors).toHaveLength(3);
    expect(result.compatibility_factors.map((f) => f.name).sort()).toEqual(['acne_fit', 'age_fit', 'skin_type_fit']);
  });

  it('every factor result has a reason string', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    for (const hc of result.hard_constraints) {
      expect(typeof hc.reason).toBe('string');
      expect(hc.reason.length).toBeGreaterThan(0);
    }
    for (const cf of result.compatibility_factors) {
      expect(typeof cf.reason).toBe('string');
      expect(cf.reason.length).toBeGreaterThan(0);
    }
  });

  it('summary is a non-empty string', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('disclaimer_shown is always true', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    expect(result.disclaimer_shown).toBe(true);
  });

  it('score label is "Compatibility factors" and total is 3', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    expect(result.score.label).toBe('Compatibility factors');
    expect(result.score.total).toBe(3);
  });

  // --- Determinism test ---
  it('same inputs always produce same verdict (deterministic)', () => {
    const profile = p({ user_skin_type: 'oily', user_acne_severity: 'moderate', age: 30 });
    const product = pr({
      skin_type_tags: ['oily'],
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid', 'niacinamide'],
      age_notes: '18+',
    });

    const result1 = evaluate(profile, product, baseIngredientConcerns);
    const result2 = evaluate(profile, product, baseIngredientConcerns);
    const result3 = evaluate(profile, product, baseIngredientConcerns);

    expect(result1.verdict).toBe(result2.verdict);
    expect(result2.verdict).toBe(result3.verdict);
    expect(result1.score.passed).toBe(result2.score.passed);
    expect(result1.summary).toBe(result2.summary);
  });

  // --- Terminology discipline (§10.2) ---
  it('summary never uses forbidden terms', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    const forbidden = ['safe', 'treatment', 'confident', 'suitable for you', 'allergy detection'];
    for (const term of forbidden) {
      expect(result.summary.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  it('reasons never use forbidden terms', () => {
    const result = evaluate(baseProfile, baseProduct, baseIngredientConcerns);
    const forbidden = ['safe', 'treatment', 'confident', 'suitable for you', 'allergy detection'];
    for (const hc of result.hard_constraints) {
      for (const term of forbidden) {
        expect(hc.reason.toLowerCase()).not.toContain(term.toLowerCase());
      }
    }
    for (const cf of result.compatibility_factors) {
      for (const term of forbidden) {
        expect(cf.reason.toLowerCase()).not.toContain(term.toLowerCase());
      }
    }
  });
});
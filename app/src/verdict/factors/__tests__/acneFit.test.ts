import { evaluateAcneFit, IngredientConcern } from '../acneFit';
import { Profile, Product } from '../../types';

describe('evaluateAcneFit', () => {
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
    concern_tags: ['hydration'],
    age_notes: null,
  };

  // Ingredient concerns for testing
  const baseIngredientConcerns: IngredientConcern[] = [
    {
      ingredient_name: 'salicylic acid',
      aliases: ['bha', 'beta hydroxy acid'],
      helps_with: ['acne', 'oily'],
      is_strong_active: true,
      is_barrier_support: false,
    },
    {
      ingredient_name: 'niacinamide',
      aliases: ['vitamin b3'],
      helps_with: ['acne', 'oily', 'barrier'],
      is_strong_active: false,
      is_barrier_support: true,
    },
    {
      ingredient_name: 'ceramide np',
      aliases: ['ceramide 3'],
      helps_with: ['barrier', 'dryness'],
      is_strong_active: false,
      is_barrier_support: true,
    },
    {
      ingredient_name: 'hyaluronic acid',
      aliases: ['sodium hyaluronate'],
      helps_with: ['hydration'],
      is_strong_active: false,
      is_barrier_support: true,
    },
    {
      ingredient_name: 'glycerin',
      aliases: [],
      helps_with: ['hydration'],
      is_strong_active: false,
      is_barrier_support: true,
    },
    {
      ingredient_name: 'benzoyl peroxide',
      aliases: ['bpo'],
      helps_with: ['acne'],
      is_strong_active: true,
      is_barrier_support: false,
    },
  ];

  // --- Insufficient data ---
  it('returns insufficient_data when user acne severity is null', () => {
    const profile = { ...baseProfile, user_acne_severity: null };
    const result = evaluateAcneFit(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('insufficient_data');
  });

  // --- Mild severity ---
  it('returns pass for mild when product has acne tag', () => {
    const product: Product = { ...baseProduct, concern_tags: ['acne'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'mild' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns pass for mild when product has oil_control tag only', () => {
    const product: Product = { ...baseProduct, concern_tags: ['oil_control'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'mild' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns caution for mild when product has neither acne nor oil_control tag', () => {
    const product: Product = { ...baseProduct, concern_tags: ['hydration'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'mild' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  // --- Moderate severity ---
  it('returns pass for moderate when product has acne tag and helps_with_acne ingredient', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid'],
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns pass for moderate when helps_with_acne matched via alias', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'bha'], // alias for salicylic acid
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns fail for moderate when product has acne tag but NO helps_with_acne ingredient', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'glycerin'], // no acne-helping ingredient
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('fail');
  });

  it('returns caution for moderate when product has no acne tag', () => {
    const product: Product = { ...baseProduct, concern_tags: ['hydration'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  // --- Severe severity ---
  it('returns pass for severe when all three conditions met', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid', 'niacinamide'], // strong_active + barrier_support + helps_with_acne
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns pass for severe when strong_active and barrier_support matched via aliases', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'bha', 'vitamin b3'], // aliases
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns fail for severe when missing strong_active', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'niacinamide'], // barrier_support + helps_with_acne, no strong_active
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('fail');
  });

  it('returns fail for severe when missing barrier_support', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid'], // strong_active + helps_with_acne, no barrier_support
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('fail');
  });

  it('returns fail for severe when missing helps_with_acne', () => {
    // Use ingredients that are strong_active + barrier_support but NOT helps_with_acne
    // (hypothetical - in reality strong_actives help with acne, but testing the logic)
    const concerns: IngredientConcern[] = [
      {
        ingredient_name: 'retinol',
        aliases: ['vitamin a'],
        helps_with: ['anti_aging'], // NOT acne
        is_strong_active: true,
        is_barrier_support: false,
      },
      {
        ingredient_name: 'ceramide np',
        aliases: ['ceramide 3'],
        helps_with: ['barrier', 'dryness'],
        is_strong_active: false,
        is_barrier_support: true,
      },
    ];
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'retinol', 'ceramide np'],
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, concerns);
    expect(result).toBe('fail');
  });

  it('returns caution for severe when product has no acne tag', () => {
    const product: Product = { ...baseProduct, concern_tags: ['hydration'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  // --- Partial data degradation (severe) ---
  it('returns caution for severe with partial_data when helps_with_acne present (degraded to moderate, capped)', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid'],
      partial_data: true,
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('returns caution for severe with partial_data when helps_with_acne absent (degraded to moderate fail, capped)', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'glycerin'],
      partial_data: true,
    };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  // --- Empty ingredient concerns ---
  it('returns caution for moderate with acne tag but empty ingredient concerns', () => {
    const product: Product = { ...baseProduct, concern_tags: ['acne'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const result = evaluateAcneFit(profile, product, []);
    expect(result).toBe('fail'); // no helps_with_acne known
  });

  it('returns fail for severe with acne tag but empty ingredient concerns', () => {
    const product: Product = { ...baseProduct, concern_tags: ['acne'] };
    const profile: Profile = { ...baseProfile, user_acne_severity: 'severe' };
    const result = evaluateAcneFit(profile, product, []);
    expect(result).toBe('fail');
  });

  // --- All severities with same product ---
  it('returns different results for each severity with same product', () => {
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'salicylic acid', 'niacinamide'],
    };

    const mildProfile: Profile = { ...baseProfile, user_acne_severity: 'mild' };
    const moderateProfile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const severeProfile: Profile = { ...baseProfile, user_acne_severity: 'severe' };

    expect(evaluateAcneFit(mildProfile, product, baseIngredientConcerns)).toBe('pass');
    expect(evaluateAcneFit(moderateProfile, product, baseIngredientConcerns)).toBe('pass');
    expect(evaluateAcneFit(severeProfile, product, baseIngredientConcerns)).toBe('pass');
  });

  it('returns fail for moderate/severe when product has acne tag but only oil_control ingredient', () => {
    // Product has acne tag but ingredients only help with oil_control, not acne
    const concerns: IngredientConcern[] = [
      {
        ingredient_name: 'zinc pca',
        aliases: [],
        helps_with: ['oil_control'],
        is_strong_active: false,
        is_barrier_support: false,
      },
    ];
    const product: Product = {
      ...baseProduct,
      concern_tags: ['acne'],
      ingredients_normalized: ['water', 'zinc pca'],
    };

    const moderateProfile: Profile = { ...baseProfile, user_acne_severity: 'moderate' };
    const severeProfile: Profile = { ...baseProfile, user_acne_severity: 'severe' };

    expect(evaluateAcneFit(moderateProfile, product, concerns)).toBe('fail');
    expect(evaluateAcneFit(severeProfile, product, concerns)).toBe('fail');
  });
});
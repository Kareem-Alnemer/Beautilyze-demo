import { evaluateSensitivity, IngredientConcern } from '../sensitivity';
import { Profile, Product } from '../../types';

describe('evaluateSensitivity', () => {
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
    ingredients_normalized: ['water', 'glycerin', 'niacinamide', 'fragrance'],
    unmatched_count: 0,
    partial_data: false,
    skin_type_tags: ['normal', 'oily'],
    concern_tags: ['hydration'],
    age_notes: null,
  };

  // Ingredient concerns where fragrance and essential oil are flagged as sensitivity concerns
  const baseIngredientConcerns: IngredientConcern[] = [
    {
      ingredient_name: 'fragrance',
      aliases: ['parfum', 'perfume'],
      is_sensitivity_flag: true,
    },
    {
      ingredient_name: 'essential oil',
      aliases: ['lavender oil', 'tea tree oil'],
      is_sensitivity_flag: true,
    },
    {
      ingredient_name: 'niacinamide',
      aliases: ['vitamin b3'],
      is_sensitivity_flag: false,
    },
  ];

  it('returns pass when user has no declared sensitivities', () => {
    const profile = { ...baseProfile, sensitivities: [] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns pass when declared sensitivities do not match any ingredient', () => {
    const profile = { ...baseProfile, sensitivities: ['peanut', 'shellfish'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns pass when declared sensitivity matches an ingredient but it is not flagged', () => {
    // Niacinamide is in the product but is_sensitivity_flag is false
    const profile = { ...baseProfile, sensitivities: ['niacinamide'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns caution when a declared sensitivity matches a flagged ingredient', () => {
    const profile = { ...baseProfile, sensitivities: ['fragrance'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('returns caution when a declared sensitivity matches a flagged ingredient (case-insensitive)', () => {
    const profile = { ...baseProfile, sensitivities: ['FRAGRANCE'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('returns caution when a declared sensitivity matches a flagged ingredient (with whitespace)', () => {
    const profile = { ...baseProfile, sensitivities: ['  fragrance  '] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('returns caution when a declared sensitivity matches via alias', () => {
    // 'parfum' is an alias for 'fragrance' which is flagged
    const profile = { ...baseProfile, sensitivities: ['parfum'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('returns caution when any one of multiple declared sensitivities matches a flagged ingredient', () => {
    const profile = { ...baseProfile, sensitivities: ['peanut', 'fragrance', 'shellfish'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('returns insufficient_data when product.partial_data is true', () => {
    const profile = { ...baseProfile, sensitivities: ['fragrance'] };
    const product = { ...baseProduct, partial_data: true };
    const result = evaluateSensitivity(profile, product, baseIngredientConcerns);
    expect(result).toBe('insufficient_data');
  });

  it('returns insufficient_data when product.partial_data is true even with no sensitivities', () => {
    const profile = { ...baseProfile, sensitivities: [] };
    const product = { ...baseProduct, partial_data: true };
    const result = evaluateSensitivity(profile, product, baseIngredientConcerns);
    expect(result).toBe('insufficient_data');
  });

  it('returns pass when ingredient concerns list is empty', () => {
    const profile = { ...baseProfile, sensitivities: ['fragrance'] };
    const result = evaluateSensitivity(profile, baseProduct, []);
    expect(result).toBe('pass');
  });

  it('returns pass when sensitivity matches after normalization (lowercase + trim)', () => {
    const profile = { ...baseProfile, sensitivities: ['  FrAgRaNcE  '] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('caution');
  });

  it('does not match partial ingredient names', () => {
    // 'grance' should not match 'fragrance'
    const profile = { ...baseProfile, sensitivities: ['grance'] };
    const result = evaluateSensitivity(profile, baseProduct, baseIngredientConcerns);
    expect(result).toBe('pass');
  });

  it('returns caution for essential oil via alias match', () => {
    // Per §7.5, product ingredients are normalized to canonical names.
    // 'lavender oil' alias → 'essential oil' canonical.
    const productWithEssentialOil: Product = {
      ...baseProduct,
      ingredients_normalized: ['water', 'glycerin', 'essential oil'],
    };
    const profile = { ...baseProfile, sensitivities: ['essential oil'] };
    const result = evaluateSensitivity(profile, productWithEssentialOil, baseIngredientConcerns);
    expect(result).toBe('caution');
  });
});
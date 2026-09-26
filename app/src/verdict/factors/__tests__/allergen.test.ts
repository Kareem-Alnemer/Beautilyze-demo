import { evaluateDeclaredAllergenConflict } from '../allergen';
import { Profile, Product } from '../../types';

describe('evaluateDeclaredAllergenConflict', () => {
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

  it('returns pass when user has no declared allergies', () => {
    const profile = { ...baseProfile, allergies: [] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('pass');
  });

  it('returns pass when declared allergens do not match any ingredient', () => {
    const profile = { ...baseProfile, allergies: ['peanut', 'shellfish'] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('pass');
  });

  it('returns fail when a declared allergen matches an ingredient (case-insensitive)', () => {
    const profile = { ...baseProfile, allergies: ['NIACINAMIDE'] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('fail');
  });

  it('returns fail when a declared allergen matches an ingredient (with whitespace)', () => {
    const profile = { ...baseProfile, allergies: ['  niacinamide  '] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('fail');
  });

  it('returns fail when any one of multiple declared allergens matches', () => {
    const profile = { ...baseProfile, allergies: ['peanut', 'niacinamide', 'shellfish'] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('fail');
  });

  it('returns fail when a known allergen matches even if product.partial_data is true', () => {
    // Blueprint §6.5 step 1 precedes step 2: a detected conflict
    // overrides insufficient-data handling.
    const profile = { ...baseProfile, allergies: ['niacinamide'] };
    const product = { ...baseProduct, partial_data: true };
    const result = evaluateDeclaredAllergenConflict(profile, product);
    expect(result).toBe('fail');
  });

  it('returns insufficient_data when product.partial_data is true even with no allergies', () => {
    const profile = { ...baseProfile, allergies: [] };
    const product = { ...baseProduct, partial_data: true };
    const result = evaluateDeclaredAllergenConflict(profile, product);
    expect(result).toBe('insufficient_data');
  });

  it('returns pass when allergen matches after normalization (lowercase + trim)', () => {
    const profile = { ...baseProfile, allergies: ['  NiAcInAmIdE  '] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('fail');
  });

  it('does not match partial ingredient names', () => {
    // 'amide' should not match 'niacinamide'
    const profile = { ...baseProfile, allergies: ['amide'] };
    const result = evaluateDeclaredAllergenConflict(profile, baseProduct);
    expect(result).toBe('pass');
  });
});
import { evaluateSkinTypeFit } from '../skinTypeFit';
import { Profile, Product, SkinType } from '../../types';

describe('evaluateSkinTypeFit', () => {
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
    ingredients_normalized: ['water', 'glycerin'],
    unmatched_count: 0,
    partial_data: false,
    skin_type_tags: ['normal', 'oily'],
    concern_tags: ['hydration'],
    age_notes: null,
  };

  it('returns insufficient_data when user skin type is null', () => {
    const profile = { ...baseProfile, user_skin_type: null };
    const result = evaluateSkinTypeFit(profile, baseProduct);
    expect(result).toBe('insufficient_data');
  });

  it('returns pass when user skin type is in product tags (single tag)', () => {
    const product: Product = { ...baseProduct, skin_type_tags: ['oily'] };
    const profile: Profile = { ...baseProfile, user_skin_type: 'oily' };
    const result = evaluateSkinTypeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when user skin type is in product tags (multiple tags)', () => {
    const profile: Profile = { ...baseProfile, user_skin_type: 'normal' };
    const result = evaluateSkinTypeFit(profile, baseProduct);
    expect(result).toBe('pass');
  });

  it('returns fail when user skin type not in tags and product has tags', () => {
    const product: Product = { ...baseProduct, skin_type_tags: ['oily'] };
    const profile: Profile = { ...baseProfile, user_skin_type: 'dry' };
    const result = evaluateSkinTypeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns caution when product has no skin-type tags (neutral)', () => {
    const product: Product = { ...baseProduct, skin_type_tags: [] };
    const result = evaluateSkinTypeFit(baseProfile, product);
    expect(result).toBe('caution');
  });

  it('returns insufficient_data when user skin type null and product has tags', () => {
    const profile = { ...baseProfile, user_skin_type: null };
    const result = evaluateSkinTypeFit(profile, baseProduct);
    expect(result).toBe('insufficient_data');
  });

  it('returns insufficient_data when user skin type null and product tags empty', () => {
    const profile = { ...baseProfile, user_skin_type: null };
    const product: Product = { ...baseProduct, skin_type_tags: [] };
    const result = evaluateSkinTypeFit(profile, product);
    expect(result).toBe('insufficient_data');
  });

  it('returns pass for each skin type enum value', () => {
    const skinTypes: SkinType[] = ['dry', 'normal', 'oily'];
    for (const skinType of skinTypes) {
      const product: Product = { ...baseProduct, skin_type_tags: [skinType] };
      const profile: Profile = { ...baseProfile, user_skin_type: skinType };
      const result = evaluateSkinTypeFit(profile, product);
      expect(result).toBe('pass');
    }
  });

  it('returns fail for each skin type when product targets other types', () => {
    const skinTypes: SkinType[] = ['dry', 'normal', 'oily'];
    for (const userType of skinTypes) {
      const otherTypes = skinTypes.filter((t) => t !== userType);
      const product: Product = { ...baseProduct, skin_type_tags: otherTypes };
      const profile: Profile = { ...baseProfile, user_skin_type: userType };
      const result = evaluateSkinTypeFit(profile, product);
      expect(result).toBe('fail');
    }
  });
});
import { evaluateAgeFit } from '../ageFit';
import { Profile, Product } from '../../types';

describe('evaluateAgeFit', () => {
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

  // --- Insufficient data ---
  it('returns insufficient_data when user age is null', () => {
    const profile = { ...baseProfile, age: null };
    const result = evaluateAgeFit(profile, baseProduct);
    expect(result).toBe('insufficient_data');
  });

  it('returns insufficient_data when user age is 0', () => {
    const profile = { ...baseProfile, age: 0 };
    const result = evaluateAgeFit(profile, baseProduct);
    expect(result).toBe('insufficient_data');
  });

  it('returns insufficient_data when user age is negative', () => {
    const profile = { ...baseProfile, age: -5 };
    const result = evaluateAgeFit(profile, baseProduct);
    expect(result).toBe('insufficient_data');
  });

  // --- No age notes ---
  it('returns pass when product age_notes is null', () => {
    const product: Product = { ...baseProduct, age_notes: null };
    const result = evaluateAgeFit(baseProfile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when product age_notes is empty string', () => {
    const product: Product = { ...baseProduct, age_notes: '' };
    const result = evaluateAgeFit(baseProfile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when product age_notes is whitespace only', () => {
    const product: Product = { ...baseProduct, age_notes: '   ' };
    const result = evaluateAgeFit(baseProfile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when product age_notes says no restriction', () => {
    const product: Product = { ...baseProduct, age_notes: 'No age restriction' };
    const result = evaluateAgeFit(baseProfile, product);
    expect(result).toBe('pass');
  });

  // --- Minimum age ---
  it('returns pass when user meets minimum age (18+)', () => {
    const product: Product = { ...baseProduct, age_notes: '18+' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when user exactly at minimum age (18+)', () => {
    const product: Product = { ...baseProduct, age_notes: '18+' };
    const profile: Profile = { ...baseProfile, age: 18 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns fail for minimum when user below (18+)', () => {
    const product: Product = { ...baseProduct, age_notes: '18+' };
    const profile: Profile = { ...baseProfile, age: 16 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns fail for minimum when user below (18+ only)', () => {
    const product: Product = { ...baseProduct, age_notes: '18+ only' };
    const profile: Profile = { ...baseProfile, age: 16 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns pass for "ages 18+" format', () => {
    const product: Product = { ...baseProduct, age_notes: 'Ages 18+' };
    const profile: Profile = { ...baseProfile, age: 20 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass for "minimum age 18" format', () => {
    const product: Product = { ...baseProduct, age_notes: 'Minimum age 18' };
    const profile: Profile = { ...baseProfile, age: 20 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  // --- Maximum age ---
  it('returns pass when user under maximum age (under 30)', () => {
    const product: Product = { ...baseProduct, age_notes: 'Under 30' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when user exactly at maximum age (under 30)', () => {
    const product: Product = { ...baseProduct, age_notes: 'Under 30' };
    const profile: Profile = { ...baseProfile, age: 30 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns fail for maximum when user above (under 30)', () => {
    const product: Product = { ...baseProduct, age_notes: 'Under 30' };
    const profile: Profile = { ...baseProfile, age: 35 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns fail for maximum when user above (under 30 strictly)', () => {
    const product: Product = { ...baseProduct, age_notes: 'Under 30 strictly' };
    const profile: Profile = { ...baseProfile, age: 35 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns pass for "max age 30" format', () => {
    const product: Product = { ...baseProduct, age_notes: 'Max age 30' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass for "up to 30" format', () => {
    const product: Product = { ...baseProduct, age_notes: 'Up to 30' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  // --- Range ---
  it('returns pass when user within range (20-40)', () => {
    const product: Product = { ...baseProduct, age_notes: '20-40' };
    const profile: Profile = { ...baseProfile, age: 30 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass when user at range boundaries (20-40)', () => {
    const product: Product = { ...baseProduct, age_notes: '20-40' };
    const profile20: Profile = { ...baseProfile, age: 20 };
    const profile40: Profile = { ...baseProfile, age: 40 };
    expect(evaluateAgeFit(profile20, product)).toBe('pass');
    expect(evaluateAgeFit(profile40, product)).toBe('pass');
  });

  it('returns fail for range when user outside (20-40)', () => {
    const product: Product = { ...baseProduct, age_notes: '20-40' };
    const profile: Profile = { ...baseProfile, age: 50 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns fail for range when user outside (20-40 only)', () => {
    const product: Product = { ...baseProduct, age_notes: '20-40 only' };
    const profile: Profile = { ...baseProfile, age: 50 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns pass for "ages 20 40" format', () => {
    const product: Product = { ...baseProduct, age_notes: 'Ages 20 40' };
    const profile: Profile = { ...baseProfile, age: 30 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns pass for en-dash range (20–40)', () => {
    const product: Product = { ...baseProduct, age_notes: '20–40' };
    const profile: Profile = { ...baseProfile, age: 30 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  // --- Qualitative ---
  it('returns fail for "adults only" when user under 18', () => {
    const product: Product = { ...baseProduct, age_notes: 'Adults only' };
    const profile: Profile = { ...baseProfile, age: 16 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns pass for "adults only" when user 18+', () => {
    const product: Product = { ...baseProduct, age_notes: 'Adults only' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('returns fail for "not for children" when user under 18', () => {
    const product: Product = { ...baseProduct, age_notes: 'Not for children' };
    const profile: Profile = { ...baseProfile, age: 14 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns caution for "mature skin" when user under 30', () => {
    const product: Product = { ...baseProduct, age_notes: 'Suitable for mature skin' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  it('returns caution for "mature skin" when user 30+', () => {
    const product: Product = { ...baseProduct, age_notes: 'Suitable for mature skin' };
    const profile: Profile = { ...baseProfile, age: 35 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  it('returns caution for "ideal for 20s-30s" when user in range', () => {
    const product: Product = { ...baseProduct, age_notes: 'Ideal for 20s-30s' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  it('returns caution for "ideal for 20s-30s" when user outside range', () => {
    const product: Product = { ...baseProduct, age_notes: 'Ideal for 20s-30s' };
    const profile: Profile = { ...baseProfile, age: 45 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  it('returns caution for "teen" when user in range', () => {
    const product: Product = { ...baseProduct, age_notes: 'Teen-friendly' };
    const profile: Profile = { ...baseProfile, age: 16 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  it('returns caution for "teen" when user outside range', () => {
    const product: Product = { ...baseProduct, age_notes: 'Teen-friendly' };
    const profile: Profile = { ...baseProfile, age: 25 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  // --- Unparseable ---
  it('returns pass for unparseable note', () => {
    const product: Product = { ...baseProduct, age_notes: 'Ask your dermatologist' };
    const result = evaluateAgeFit(baseProfile, product);
    expect(result).toBe('pass');
  });

  it('returns pass for empty note after trimming', () => {
    const product: Product = { ...baseProduct, age_notes: '   \n\t  ' };
    const result = evaluateAgeFit(baseProfile, product);
    expect(result).toBe('pass');
  });

  // --- Multiple restrictions ---
  it('returns fail when any strong restriction fails (18+, not for sensitive)', () => {
    const product: Product = { ...baseProduct, age_notes: '18+, not for sensitive skin' };
    const profile: Profile = { ...baseProfile, age: 16 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('fail');
  });

  it('returns caution when mild restriction fails but no strong', () => {
    const product: Product = { ...baseProduct, age_notes: 'Ideal for 20s, gentle formula' };
    const profile: Profile = { ...baseProfile, age: 40 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('caution');
  });

  // --- Case insensitivity ---
  it('handles uppercase notes', () => {
    const product: Product = { ...baseProduct, age_notes: '18+' };
    const profile: Profile = { ...baseProfile, age: 20 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });

  it('handles mixed case notes', () => {
    const product: Product = { ...baseProduct, age_notes: 'AgEs 20-40' };
    const profile: Profile = { ...baseProfile, age: 30 };
    const result = evaluateAgeFit(profile, product);
    expect(result).toBe('pass');
  });
});
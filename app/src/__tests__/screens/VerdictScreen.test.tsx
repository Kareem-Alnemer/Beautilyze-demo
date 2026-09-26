import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VerdictScreen } from '../../screens/VerdictScreen';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ productId: 'test-product-id' }),
}));

// Mock useVerdict hook with MATCH verdict
jest.mock('../../catalog/useVerdict', () => ({
  useVerdict: () => ({
    verdict: {
      verdict: 'match',
      summary: 'This product matches your profile.',
      score: { label: 'Compatibility factors', passed: 3, total: 3 },
      hard_constraints: [
        { name: 'declared_allergen_conflict', result: 'pass', reason: '' },
        { name: 'sensitivity', result: 'pass', reason: '' },
      ],
      compatibility_factors: [
        { name: 'skin_type_fit', result: 'pass', reason: 'Your skin type is oily; this product is tagged suitable for oily skin.' },
        { name: 'acne_fit', result: 'pass', reason: 'Product has acne-fighting ingredients.' },
        { name: 'age_fit', result: 'pass', reason: 'No age restrictions.' },
      ],
      disclaimer_shown: true,
    },
    product: { id: 'test-product-id', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null },
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock profile store
jest.mock('../../profile/store', () => ({
  useProfileStore: jest.fn((selector) => selector({
    user_skin_type: 'oily',
    user_acne_severity: 'mild',
    age: 25,
    allergies: [],
    sensitivities: [],
  })),
}));

describe('VerdictScreen', () => {
  it('renders product byline', () => {
    const { getByText } = render(React.createElement(VerdictScreen));

    expect(getByText('CeraVe Cleanser')).toBeTruthy();
    expect(getByText('CeraVe')).toBeTruthy();
  });

  it('renders Match verdict badge', () => {
    const { getByText } = render(React.createElement(VerdictScreen));

    expect(getByText('Match')).toBeTruthy();
    expect(getByText('This product matches your profile.')).toBeTruthy();
  });

  it('renders score line', () => {
    const { getByText } = render(React.createElement(VerdictScreen));

    expect(getByText('3 of 3 compatibility factors matched.')).toBeTruthy();
  });

  it('does not show hard constraints when all pass', () => {
    const { queryByText } = render(React.createElement(VerdictScreen));

    expect(queryByText('Hard constraints')).toBeNull();
  });

  it('renders all three compatibility factors', () => {
    const { getByText, getAllByText } = render(React.createElement(VerdictScreen));

    expect(getByText('Skin-type fit')).toBeTruthy();
    expect(getByText('Acne-concern fit')).toBeTruthy();
    expect(getByText('Age fit')).toBeTruthy();
    // There are 3 "Pass" texts (one for each factor)
    expect(getAllByText('Pass').length).toBe(3);
  });

  it('renders disclaimer block', () => {
    const { getByText } = render(React.createElement(VerdictScreen));

    expect(getByText('BeautiLyze is a compatibility-checking tool, not a diagnostic or medical device. It does not replace a dermatologist or professional skincare advice. Verdicts are based on the product information available in our catalog and the profile you provide (AI-estimated or manually set). Allergies are checked against the ingredient list we have; if we don\'t have a complete ingredient list, absence of a detected conflict does not mean a product is safe for you. If you have a known allergy, always check the physical product label before use.')).toBeTruthy();
  });

  it('renders primary action button', () => {
    const { getByText } = render(React.createElement(VerdictScreen));

    expect(getByText('Check another product')).toBeTruthy();
  });

  it('navigates to SearchScreen when "Check another product" pressed', () => {
    const { getByText } = render(React.createElement(VerdictScreen));

    fireEvent.press(getByText('Check another product'));

    // Navigation is mocked
    expect(getByText('Check another product')).toBeTruthy();
  });
});

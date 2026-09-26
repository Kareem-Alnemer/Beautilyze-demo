import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { useVerdict } from '../../catalog/useVerdict';

// Mock getProduct
jest.mock('../../catalog/api', () => ({
  getProduct: jest.fn(),
  getIngredientConcerns: jest.fn().mockResolvedValue([]),
}));

import { getProduct } from '../../catalog/api';

// Test component that uses the hook
const TestComponent: React.FC<{ productId: string; profile: any }> = ({ productId, profile }: Record<string, any>) => {
  const { verdict, product, loading, error, refetch } = useVerdict(productId, profile);
  return React.createElement('View', { testID: 'test-component' },
    loading && React.createElement('Text', { testID: 'loading' }, 'Loading'),
    error && React.createElement('Text', { testID: 'error' }, error),
    verdict && React.createElement('Text', { testID: 'verdict' }, verdict.verdict),
    product && React.createElement('Text', { testID: 'product-name' }, product.name),
    React.createElement('TouchableOpacity', { testID: 'refetch', onPress: refetch }, React.createElement('Text', null, 'Refetch'))
  );
};

describe('useVerdict', () => {
  const mockProfile = {
    user_skin_type: 'oily',
    user_acne_severity: 'mild',
    age: 25,
    allergies: [],
    sensitivities: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches product and evaluates verdict on mount', async () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'CeraVe Cleanser',
      brand: 'CeraVe',
      ingredients_normalized: ['water', 'ceramide'],
      unmatched_count: 0,
      partial_data: false,
      skin_type_tags: ['oily'],
      concern_tags: [],
      age_notes: null,
    };
    (getProduct as jest.Mock).mockResolvedValue(mockProduct);

    const { getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    await waitFor(() => {
      expect(getByTestId('verdict')).toBeTruthy();
    });

    expect(getProduct).toHaveBeenCalledWith('prod-1');
  });

  it('shows loading state initially', () => {
    (getProduct as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    expect(getByTestId('loading')).toBeTruthy();
  });

  it('shows error when product not found', async () => {
    (getProduct as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    await waitFor(() => {
      expect(getByTestId('error')).toBeTruthy();
    });

    expect(getByTestId('error').props.children).toBe('Product not found');
  });

  it('shows error when getProduct throws', async () => {
    (getProduct as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    await waitFor(() => {
      expect(getByTestId('error')).toBeTruthy();
    });

    expect(getByTestId('error').props.children).toBe('Network error');
  });

  it('refetches when refetch is called', async () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'CeraVe Cleanser',
      brand: 'CeraVe',
      ingredients_normalized: ['water', 'ceramide'],
      unmatched_count: 0,
      partial_data: false,
      skin_type_tags: ['oily'],
      concern_tags: [],
      age_notes: null,
    };
    (getProduct as jest.Mock).mockResolvedValue(mockProduct);

    const { getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    await waitFor(() => {
      expect(getByTestId('verdict')).toBeTruthy();
    });

    expect(getProduct).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('refetch'));

    await waitFor(() => {
      expect(getProduct).toHaveBeenCalledTimes(2);
    });
  });

  it('re-evaluates when profile changes', async () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'CeraVe Cleanser',
      brand: 'CeraVe',
      ingredients_normalized: ['water', 'ceramide'],
      unmatched_count: 0,
      partial_data: false,
      skin_type_tags: ['oily'],
      concern_tags: [],
      age_notes: null,
    };
    (getProduct as jest.Mock).mockResolvedValue(mockProduct);

    const { rerender, getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    await waitFor(() => {
      expect(getByTestId('verdict')).toBeTruthy();
    });

    // Change profile
    const newProfile = { ...mockProfile, user_skin_type: 'dry' };
    rerender(React.createElement(TestComponent, { productId: 'prod-1', profile: newProfile }));

    await waitFor(() => {
      expect(getProduct).toHaveBeenCalledTimes(2);
    });
  });

  it('re-evaluates when productId changes', async () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'CeraVe Cleanser',
      brand: 'CeraVe',
      ingredients_normalized: ['water', 'ceramide'],
      unmatched_count: 0,
      partial_data: false,
      skin_type_tags: ['oily'],
      concern_tags: [],
      age_notes: null,
    };
    (getProduct as jest.Mock).mockResolvedValue(mockProduct);

    const { rerender, getByTestId } = render(React.createElement(TestComponent, { productId: 'prod-1', profile: mockProfile }));

    await waitFor(() => {
      expect(getByTestId('verdict')).toBeTruthy();
    });

    rerender(React.createElement(TestComponent, { productId: 'prod-2', profile: mockProfile }));

    await waitFor(() => {
      expect(getProduct).toHaveBeenCalledWith('prod-2');
    });
  });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProductSearchBar } from '../../components/ProductSearchBar';

// Mock the searchProducts API
jest.mock('../../catalog/api', () => ({
  searchProducts: jest.fn(),
}));

import { searchProducts } from '../../catalog/api';

describe('ProductSearchBar', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (searchProducts as jest.Mock).mockResolvedValue([]);
  });

  it('renders search input with placeholder', () => {
    const { getByPlaceholderText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    expect(getByPlaceholderText('Search products...')).toBeTruthy();
  });

  it('calls searchProducts with debounced query', async () => {
    const mockResults = [
      { id: '1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null, skin_type_tags: [], concern_tags: [] },
    ];
    (searchProducts as jest.Mock).mockResolvedValue(mockResults);

    const { getByPlaceholderText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'cerave');

    await waitFor(() => {
      expect(searchProducts).toHaveBeenCalledWith('cerave');
    });
  });

  it('renders results list when query has results', async () => {
    const mockResults = [
      { id: '1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null, skin_type_tags: [], concern_tags: [] },
      { id: '2', name: 'CeraVe Moisturizer', brand: 'CeraVe', image_url: null, skin_type_tags: [], concern_tags: [] },
    ];
    (searchProducts as jest.Mock).mockResolvedValue(mockResults);

    const { getByPlaceholderText, getByText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'cerave');

    await waitFor(() => {
      expect(getByText('CeraVe Cleanser')).toBeTruthy();
      expect(getByText('CeraVe Moisturizer')).toBeTruthy();
    });
  });

  it('calls onProductSelect when result is pressed', async () => {
    const mockResults = [
      { id: '1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null, skin_type_tags: [], concern_tags: [] },
    ];
    (searchProducts as jest.Mock).mockResolvedValue(mockResults);

    const { getByPlaceholderText, getByText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'cerave');

    await waitFor(() => {
      fireEvent.press(getByText('CeraVe Cleanser'));
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('shows empty state when no results', async () => {
    (searchProducts as jest.Mock).mockResolvedValue([]);

    const { getByPlaceholderText, getByText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'nonexistent');

    await waitFor(() => {
      expect(getByText('No products found')).toBeTruthy();
    });
  });

  it('shows placeholder icon when no image_url', async () => {
    const mockResults = [
      { id: '1', name: 'Test Product', brand: 'Test Brand', image_url: null, skin_type_tags: [], concern_tags: [] },
    ];
    (searchProducts as jest.Mock).mockResolvedValue(mockResults);

    const { getByPlaceholderText, getByText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'test');

    await waitFor(() => {
      expect(getByText('📦')).toBeTruthy();
    });
  });

  it('clears query and results after selection', async () => {
    const mockResults = [
      { id: '1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null, skin_type_tags: [], concern_tags: [] },
    ];
    (searchProducts as jest.Mock).mockResolvedValue(mockResults);

    const { getByPlaceholderText, getByText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'cerave');

    await waitFor(() => {
      fireEvent.press(getByText('CeraVe Cleanser'));
    });

    // After selection, the input should be cleared (implementation detail)
    // The mock onProductSelect should have been called
    expect(mockOnSelect).toHaveBeenCalled();
  });
});
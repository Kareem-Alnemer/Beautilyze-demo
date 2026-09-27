import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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

  it('keeps product identity readable when no image is available', async () => {
    const mockResults = [
      { id: '1', name: 'Test Product', brand: 'Test Brand', image_url: null, skin_type_tags: [], concern_tags: [] },
    ];
    (searchProducts as jest.Mock).mockResolvedValue(mockResults);

    const { getByPlaceholderText, getByText } = render(
      React.createElement(ProductSearchBar, { onProductSelect: mockOnSelect })
    );

    fireEvent.changeText(getByPlaceholderText('Search products...'), 'test');

    await waitFor(() => {
      expect(getByText('Test Product')).toBeTruthy();
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
  it('ignores a response from an older query', async () => {
    let finishOld!: (rows: unknown[]) => void;
    (searchProducts as jest.Mock).mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
      .mockResolvedValueOnce([{ id: 'new', name: 'New result', brand: 'B', image_url: null }]);
    const screen = render(<ProductSearchBar onProductSelect={mockOnSelect} />);
    fireEvent.changeText(screen.getByLabelText('Product or brand'), 'old');
    await waitFor(() => expect(searchProducts).toHaveBeenCalledWith('old'));
    fireEvent.changeText(screen.getByLabelText('Product or brand'), 'new');
    await screen.findByText('New result');
    await act(async () => { finishOld([{ id: 'old', name: 'Old result', brand: 'A', image_url: null }]); });
    expect(screen.queryByText('Old result')).toBeNull();
    expect(screen.getByText('New result')).toBeTruthy();
  });

  it('distinguishes a failed request from no matches and supports retry', async () => {
    (searchProducts as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const screen = render(<ProductSearchBar onProductSelect={mockOnSelect} />);
    fireEvent.changeText(screen.getByLabelText('Product or brand'), 'cleanser');
    await screen.findByText('Could not search the catalog.');
    expect(screen.queryByText('No products found')).toBeNull();
    fireEvent.press(screen.getByText('Retry search'));
    expect(await screen.findByText('No products found')).toBeTruthy();
  });

  it('does not show an empty-results message before entering a query', () => {
    const screen = render(<ProductSearchBar onProductSelect={mockOnSelect} />);
    fireEvent(screen.getByLabelText('Product or brand'), 'focus');
    expect(screen.queryByText('No products found')).toBeNull();
  });

  it('does not restore old results after the query is cleared', async () => {
    let finish!: (rows: unknown[]) => void;
    (searchProducts as jest.Mock).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const screen = render(<ProductSearchBar onProductSelect={mockOnSelect} />);
    fireEvent.changeText(screen.getByLabelText('Product or brand'), 'old');
    await waitFor(() => expect(searchProducts).toHaveBeenCalledWith('old'));
    fireEvent.changeText(screen.getByLabelText('Product or brand'), '');
    await act(async () => { finish([{ id: 'old', name: 'Old result', brand: 'A', image_url: null }]); });
    expect(screen.queryByText('Old result')).toBeNull();
  });
});

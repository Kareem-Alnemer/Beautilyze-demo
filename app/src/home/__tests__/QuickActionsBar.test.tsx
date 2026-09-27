import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickActionsBar } from '../QuickActionsBar';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('QuickActionsBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both action cards with correct titles', () => {
    const { getByText } = render(React.createElement(QuickActionsBar));

    expect(getByText('Scan Skin')).toBeTruthy();
    expect(getByText('Search Catalog')).toBeTruthy();
  });

  it('does not claim that catalog entries are independently verified', () => {
    const { queryByText } = render(React.createElement(QuickActionsBar));
    expect(queryByText(/verified products/)).toBeNull();
  });

  it('does not describe a face scan as a product scan', () => {
    const { queryByText } = render(React.createElement(QuickActionsBar));
    expect(queryByText('Scan Product')).toBeNull();
  });

  it('navigates to /scan when Scan Skin is pressed', () => {
    const { getByText } = render(React.createElement(QuickActionsBar));

    fireEvent.press(getByText('Scan Skin'));

    expect(mockPush).toHaveBeenCalledWith('/scan');
  });

  it('navigates to /search when Search Catalog is pressed', () => {
    const { getByText } = render(React.createElement(QuickActionsBar));

    fireEvent.press(getByText('Search Catalog'));

    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('calls onScanPress prop when provided', () => {
    const mockOnScanPress = jest.fn();
    const { getByText } = render(React.createElement(QuickActionsBar, { onScanPress: mockOnScanPress }));

    fireEvent.press(getByText('Scan Skin'));

    expect(mockOnScanPress).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('calls onSearchPress prop when provided', () => {
    const mockOnSearchPress = jest.fn();
    const { getByText } = render(React.createElement(QuickActionsBar, { onSearchPress: mockOnSearchPress }));

    fireEvent.press(getByText('Search Catalog'));

    expect(mockOnSearchPress).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('has accessibility labels', () => {
    const { getByTestId } = render(React.createElement(QuickActionsBar));

    const scanCard = getByTestId('quick-action-scan-skin');
    const searchCard = getByTestId('quick-action-search-catalog');

    expect(scanCard.props.accessibilityLabel).toBe('Scan your skin for optional AI estimates');
    expect(searchCard.props.accessibilityLabel).toBe('Search the product catalog');
    expect(scanCard.props.accessibilityRole).toBe('button');
    expect(searchCard.props.accessibilityRole).toBe('button');
  });

  it('keeps the catalog action before the optional scan action', () => {
    const { getAllByRole } = render(React.createElement(QuickActionsBar));
    expect(getAllByRole('button')[0].props.accessibilityLabel).toBe('Search the product catalog');
  });
});

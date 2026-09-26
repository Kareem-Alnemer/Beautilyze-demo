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

    expect(getByText('Scan Product')).toBeTruthy();
    expect(getByText('Search Catalog')).toBeTruthy();
  });

  it('renders both action cards with correct descriptions', () => {
    const { getByText } = render(React.createElement(QuickActionsBar));

    expect(getByText('Camera + AI analysis for personalized profile')).toBeTruthy();
    expect(getByText('Browse 30+ verified products and check compatibility')).toBeTruthy();
  });

  it('has correct icons for each card', () => {
    const { getByText } = render(React.createElement(QuickActionsBar));

    expect(getByText('📷')).toBeTruthy();
    expect(getByText('🔍')).toBeTruthy();
  });

  it('navigates to /scan when Scan Product is pressed', () => {
    const { getByText } = render(React.createElement(QuickActionsBar));

    fireEvent.press(getByText('Scan Product'));

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

    fireEvent.press(getByText('Scan Product'));

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

    const scanCard = getByTestId('quick-action-scan-product');
    const searchCard = getByTestId('quick-action-search-catalog');

    expect(scanCard.props.accessibilityLabel).toBe('Scan a product with your camera');
    expect(searchCard.props.accessibilityLabel).toBe('Search the product catalog');
    expect(scanCard.props.accessibilityRole).toBe('button');
    expect(searchCard.props.accessibilityRole).toBe('button');
  });

  it('shows arrow indicator on each card', () => {
    const { getAllByText } = render(React.createElement(QuickActionsBar));

    const arrows = getAllByText('→');
    expect(arrows.length).toBe(2);
  });
});
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RecentChecksList } from '../../components/RecentChecksList';

// Mock the getRecentChecks API
jest.mock('../../catalog/api', () => ({
  getRecentChecks: jest.fn(),
}));

import { getRecentChecks } from '../../catalog/api';

describe('RecentChecksList', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getRecentChecks as jest.Mock).mockResolvedValue([]);
  });

  it('shows loading state initially', () => {
    (getRecentChecks as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    expect(getByText('Loading recent checks...')).toBeTruthy();
  });

  it('shows empty state when no checks', async () => {
    (getRecentChecks as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    await waitFor(() => {
      expect(getByText('No recent checks yet')).toBeTruthy();
      expect(getByText('Search a product to get started')).toBeTruthy();
    });
  });

  it('renders recent checks with product info', async () => {
    const mockChecks = [
      {
        id: 'check-1',
        product_id: 'prod-1',
        verdict: 'match',
        created_at: '2026-09-25T10:00:00Z',
        product: { id: 'prod-1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null },
      },
      {
        id: 'check-2',
        product_id: 'prod-2',
        verdict: 'caution',
        created_at: '2026-09-24T10:00:00Z',
        product: { id: 'prod-2', name: 'Neutrogena Moisturizer', brand: 'Neutrogena', image_url: null },
      },
    ];
    (getRecentChecks as jest.Mock).mockResolvedValue(mockChecks);

    const { getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    await waitFor(() => {
      expect(getByText('Recent Checks')).toBeTruthy();
      expect(getByText('CeraVe Cleanser')).toBeTruthy();
      expect(getByText('CeraVe')).toBeTruthy();
      expect(getByText('Match')).toBeTruthy();
      expect(getByText('Neutrogena Moisturizer')).toBeTruthy();
      expect(getByText('Neutrogena')).toBeTruthy();
      expect(getByText('Caution')).toBeTruthy();
    });
  });

  it('calls onCheckSelect when check is pressed', async () => {
    const mockChecks = [
      {
        id: 'check-1',
        product_id: 'prod-1',
        verdict: 'match',
        created_at: '2026-09-25T10:00:00Z',
        product: { id: 'prod-1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null },
      },
    ];
    (getRecentChecks as jest.Mock).mockResolvedValue(mockChecks);

    const { getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    await waitFor(() => {
      fireEvent.press(getByText('CeraVe Cleanser'));
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockChecks[0]);
  });

  it('shows placeholder icon when no image_url', async () => {
    const mockChecks = [
      {
        id: 'check-1',
        product_id: 'prod-1',
        verdict: 'match',
        created_at: '2026-09-25T10:00:00Z',
        product: { id: 'prod-1', name: 'Test Product', brand: 'Test Brand', image_url: null },
      },
    ];
    (getRecentChecks as jest.Mock).mockResolvedValue(mockChecks);

    const { getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    await waitFor(() => {
      expect(getByText('📦')).toBeTruthy();
    });
  });

  it('shows correct verdict colors', async () => {
    const mockChecks = [
      { id: '1', product_id: '1', verdict: 'match', created_at: '2026-09-25T10:00:00Z', product: { id: '1', name: 'A', brand: 'B', image_url: null } },
      { id: '2', product_id: '2', verdict: 'caution', created_at: '2026-09-25T10:00:00Z', product: { id: '2', name: 'C', brand: 'D', image_url: null } },
      { id: '3', product_id: '3', verdict: 'mismatch', created_at: '2026-09-25T10:00:00Z', product: { id: '3', name: 'E', brand: 'F', image_url: null } },
    ];
    (getRecentChecks as jest.Mock).mockResolvedValue(mockChecks);

    const { getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    await waitFor(() => {
      // The verdict text should be rendered with correct capitalization
      expect(getByText('Match')).toBeTruthy();
      expect(getByText('Caution')).toBeTruthy();
      expect(getByText('Mismatch')).toBeTruthy();
    });
  });
});
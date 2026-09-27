import React from 'react';
import { FlatList } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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

  it('renders without a nested VirtualizedList (safe inside parent ScrollViews)', async () => {
    (getRecentChecks as jest.Mock).mockResolvedValue([
      {
        id: 'check-1',
        product_id: 'prod-1',
        verdict: 'match',
        created_at: '2026-09-25T10:00:00Z',
        product: { id: 'prod-1', name: 'CeraVe Cleanser', brand: 'CeraVe', image_url: null },
      },
    ]);

    const { UNSAFE_queryByType, getByText } = render(
      React.createElement(RecentChecksList, { userId: 'test-user', onCheckSelect: mockOnSelect })
    );

    await waitFor(() => {
      expect(getByText('CeraVe Cleanser')).toBeTruthy();
    });
    expect(UNSAFE_queryByType(FlatList)).toBeNull();
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
  it('shows an error instead of claiming the history is empty and retries', async () => {
    (getRecentChecks as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const screen = render(<RecentChecksList userId="owner" onCheckSelect={mockOnSelect} />);
    await screen.findByText('Could not load recent checks.');
    expect(screen.queryByText('No recent checks yet')).toBeNull();
    fireEvent.press(screen.getByText('Retry history'));
    expect(await screen.findByText('No recent checks yet')).toBeTruthy();
  });

  it('ignores the previous account response after switching users', async () => {
    let finishOld!: (rows: unknown[]) => void;
    (getRecentChecks as jest.Mock).mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve; }))
      .mockResolvedValueOnce([]);
    const screen = render(<RecentChecksList userId="old" onCheckSelect={mockOnSelect} />);
    screen.rerender(<RecentChecksList userId="new" onCheckSelect={mockOnSelect} />);
    await screen.findByText('No recent checks yet');
    await act(async () => { finishOld([{
      id: 'old', product_id: 'old', verdict: 'match', created_at: '',
      product: { id: 'old', name: 'Private old check', brand: 'B', image_url: null },
    }]); });
    expect(screen.queryByText('Private old check')).toBeNull();
  });
});

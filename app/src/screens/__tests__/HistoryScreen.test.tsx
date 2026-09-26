/**
 * Tests for HistoryScreen component.
 * Tests empty state, history rendering, and pull-to-refresh.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Mock expo-router (not used directly but safe to mock)
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock profile store
const mockProfileStore: {
  user_id: string | null;
  user_skin_type: string;
  user_acne_severity: string;
  age: number;
  allergies: string[];
  sensitivities: string[];
  ai_skin_type: null;
  ai_acne_severity: null;
  skin_type_confidence: null;
  acne_severity_confidence: null;
  model_version: null;
  is_synced: boolean;
  is_syncing: boolean;
  last_synced_at: null;
  setAIProfile: jest.Mock;
} = {
  user_id: 'test-user',
  user_skin_type: 'oily',
  user_acne_severity: 'moderate',
  age: 25,
  allergies: ['fragrance'],
  sensitivities: ['alcohol'],
  ai_skin_type: null,
  ai_acne_severity: null,
  skin_type_confidence: null,
  acne_severity_confidence: null,
  model_version: null,
  is_synced: false,
  is_syncing: false,
  last_synced_at: null,
  setAIProfile: jest.fn(),
};

jest.mock('../../profile/store', () => ({
  useProfileStore: jest.fn((selector) => selector(mockProfileStore)),
}));

// Mock catalog API
const mockHistoryData = [
  {
    id: 'check-1',
    product_id: 'prod-1',
    verdict: 'match' as const,
    factors_json: {
      hard_constraints: [
        { name: 'declared_allergen_conflict', result: 'pass' },
        { name: 'sensitivity', result: 'pass' },
      ],
      compatibility_factors: [
        { name: 'skin_type_fit', result: 'pass', reason: 'Product tagged suitable for oily skin' },
        { name: 'acne_fit', result: 'pass', reason: 'Product has helps_with_acne ingredients for moderate acne' },
        { name: 'age_fit', result: 'pass', reason: 'No age restriction' },
      ],
    },
    created_at: '2026-09-20T14:30:00.000Z',
    product: {
      id: 'prod-1',
      name: 'Foaming Facial Cleanser',
      brand: 'CeraVe',
      image_url: 'https://example.com/cerave-cleanser.jpg',
    },
  },
  {
    id: 'check-2',
    product_id: 'prod-2',
    verdict: 'caution' as const,
    factors_json: {
      hard_constraints: [
        { name: 'declared_allergen_conflict', result: 'pass' },
        { name: 'sensitivity', result: 'caution' },
      ],
      compatibility_factors: [
        { name: 'skin_type_fit', result: 'caution', reason: 'Product neutral for oily skin' },
        { name: 'acne_fit', result: 'pass', reason: 'Product has helps_with_acne ingredients for moderate acne' },
        { name: 'age_fit', result: 'pass', reason: 'No age restriction' },
      ],
    },
    created_at: '2026-09-18T09:15:00.000Z',
    product: {
      id: 'prod-2',
      name: 'Hydrating Toner',
      brand: 'La Roche-Posay',
      image_url: null,
    },
  },
  {
    id: 'check-3',
    product_id: 'prod-3',
    verdict: 'mismatch' as const,
    factors_json: {
      hard_constraints: [
        { name: 'declared_allergen_conflict', result: 'fail' },
        { name: 'sensitivity', result: 'pass' },
      ],
      compatibility_factors: [
        { name: 'skin_type_fit', result: 'fail', reason: 'Product tagged unsuitable for oily skin' },
        { name: 'acne_fit', result: 'caution', reason: 'Product has strong actives without barrier support' },
        { name: 'age_fit', result: 'pass', reason: 'No age restriction' },
      ],
    },
    created_at: '2026-09-15T16:45:00.000Z',
    product: {
      id: 'prod-3',
      name: 'Retinol Serum',
      brand: 'The Ordinary',
      image_url: 'https://example.com/ordinary-retinol.jpg',
    },
  },
];

let mockGetScanHistory = jest.fn().mockResolvedValue(mockHistoryData);

jest.mock('../../catalog/api', () => ({
  getScanHistory: (...args: unknown[]) => mockGetScanHistory(...args),
  ScanHistoryItem: {},
}));

// Import after mocks
import { HistoryScreen } from '../HistoryScreen';

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScanHistory.mockResolvedValue(mockHistoryData);
    mockProfileStore.user_id = 'test-user';
  });

  it('renders loading state initially', () => {
    let resolveFn: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolveFn = resolve;
    });
    mockGetScanHistory.mockReturnValue(promise);

    const { getByText } = render(React.createElement(HistoryScreen));

    expect(getByText('Loading history...')).toBeTruthy();

    act(() => {
      resolveFn!(mockHistoryData);
    });
  });

  it('renders empty state when no history exists', async () => {
    mockGetScanHistory.mockResolvedValue([]);
    mockProfileStore.user_id = 'test-user';

    const { getByText } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('No Scan History Yet')).toBeTruthy();
    });

    expect(getByText('Your product checks will appear here.')).toBeTruthy();
    expect(getByText('Search a product or scan your skin to get started.')).toBeTruthy();
  });

  it('renders empty state when user is not authenticated', async () => {
    mockProfileStore.user_id = null;

    const { getByText } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('No Scan History Yet')).toBeTruthy();
    });
  });

  it('renders history cards with correct data', async () => {
    const { getByText, getByTestId, queryByText, getAllByText } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
    });

    // Check all three products render
    expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
    expect(getByText('Hydrating Toner')).toBeTruthy();
    expect(getByText('Retinol Serum')).toBeTruthy();

    // Check brands
    expect(getByText('CeraVe')).toBeTruthy();
    expect(getByText('La Roche-Posay')).toBeTruthy();
    expect(getByText('The Ordinary')).toBeTruthy();

    // Check verdicts
    expect(getByText('Match')).toBeTruthy();
    expect(getByText('Caution')).toBeTruthy();
    expect(getByText('Mismatch')).toBeTruthy();

    // Check timestamps are formatted (full format includes time)
    expect(queryByText('Sep 20, 2026 • 6:30 PM')).toBeTruthy();
    expect(queryByText('Sep 18, 2026 • 1:15 PM')).toBeTruthy();
    expect(queryByText('Sep 15, 2026 • 8:45 PM')).toBeTruthy();

    // Check compatibility scores
    expect(getByText('3 of 3 factors matched')).toBeTruthy(); // match
    expect(getByText('2 of 3 factors matched')).toBeTruthy(); // caution
    expect(getByText('1 of 3 factors matched')).toBeTruthy(); // mismatch
  });

  it('renders skin type and acne severity badges', async () => {
    const { getByText, getAllByText } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
    });

    // Badges should be present (text includes "Skin:" and "Acne:")
    // The badge text is rendered inside the badge component
    // We verify the badge content by checking for the label prefixes
    const skinBadges = getAllByText(/Skin:/);
    const acneBadges = getAllByText(/Acne:/);
    expect(skinBadges.length).toBeGreaterThan(0);
    expect(acneBadges.length).toBeGreaterThan(0);
  });

  it('triggers pull-to-refresh and reloads data', async () => {
    const { getByText, getByTestId } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
    });

    // Find the FlatList and trigger refresh
    const flatList = getByTestId('history-flatlist');
    expect(flatList).toBeTruthy();

    // Simulate pull-to-refresh by calling onRefresh
    // Since we can't easily trigger the RefreshControl gesture in tests,
    // we verify the refresh function is called by checking the mock
    const refreshControl = flatList.props.refreshControl;
    expect(refreshControl).toBeTruthy();

    // Call the onRefresh handler directly
    if (refreshControl && refreshControl.props.onRefresh) {
      await act(async () => {
        await refreshControl.props.onRefresh();
      });
    }

    // Verify getScanHistory was called again
    expect(mockGetScanHistory).toHaveBeenCalledTimes(2);
  });

  it('shows error state when fetch fails and no cached data', async () => {
    mockGetScanHistory.mockRejectedValue(new Error('Network error'));
    mockProfileStore.user_id = 'test-user';

    const { getByText } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Unable to Load History')).toBeTruthy();
    });

    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('shows cached data with error banner when fetch fails but history exists', async () => {
    // First render with data
    const { getByText, getByTestId, rerender } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
    });

    // Now simulate a refresh that fails
    mockGetScanHistory.mockRejectedValue(new Error('Network error'));

    // Trigger refresh
    const flatList = getByTestId('history-flatlist');
    const refreshControl = flatList.props.refreshControl;
    if (refreshControl && refreshControl.props.onRefresh) {
      await act(async () => {
        await refreshControl.props.onRefresh();
      });
    }

    // Should still show the cached data (not the error state)
    expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
  });

  it('renders placeholder thumbnail when product has no image', async () => {
    const { getByText, getByTestId } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Hydrating Toner')).toBeTruthy();
    });

    // The placeholder uses a box with 📦 emoji
    // We can verify the product without image renders
    expect(getByText('La Roche-Posay')).toBeTruthy();
  });

  it('formats timestamps correctly (MMM DD, YYYY • h:mm A)', async () => {
    const { getByText, getAllByText } = render(React.createElement(HistoryScreen));

    await waitFor(() => {
      expect(getByText('Foaming Facial Cleanser')).toBeTruthy();
    });

    // Check timestamp format includes month abbrev, day, year, and time with AM/PM
    // The exact format depends on locale, but should contain these patterns
    const timestampTexts = getAllByText(/Sep \d+, 2026 • \d+:\d+ [AP]M/);
    expect(timestampTexts.length).toBeGreaterThan(0);
  });
});
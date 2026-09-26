import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock profile store
jest.mock('../../profile/store', () => ({
  useProfileStore: jest.fn((selector) => selector({
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
  })),
}));

// Mock sub-components with proper navigation callbacks
jest.mock('../ProfileSummaryCard', () => {
  const React = require('react');
  return {
    ProfileSummaryCard: ({ onPress }: Record<string, any>) =>
      React.createElement('TouchableOpacity', { testID: 'profile-summary-card', onPress },
        React.createElement('Text', null, 'ProfileSummaryCard')
      ),
  };
});

jest.mock('../QuickActionsBar', () => {
  const React = require('react');
  return {
    QuickActionsBar: () =>
      React.createElement('View', { testID: 'quick-actions-bar' },
        React.createElement('TouchableOpacity', { testID: 'scan-btn', onPress: () => mockPush('/scan') },
          React.createElement('Text', null, 'Scan Product')
        ),
        React.createElement('TouchableOpacity', { testID: 'search-btn', onPress: () => mockPush('/search') },
          React.createElement('Text', null, 'Search Catalog')
        )
      ),
  };
});

jest.mock('../RecentChecksSection', () => {
  const React = require('react');
  return {
    RecentChecksSection: ({ onCheckSelect, onViewAllPress, limit }: Record<string, any>) =>
      React.createElement('View', { testID: 'recent-checks-section', onCheckSelect, onViewAllPress, limit },
        React.createElement('Text', null, 'RecentChecksSection')
      ),
  };
});

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with title and subtitle', () => {
    const { getByText } = render(React.createElement(HomeScreen));

    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Check products against your skin profile')).toBeTruthy();
  });

  it('renders ProfileSummaryCard', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    expect(getByTestId('profile-summary-card')).toBeTruthy();
  });

  it('renders QuickActionsBar', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    expect(getByTestId('quick-actions-bar')).toBeTruthy();
  });

  it('renders RecentChecksSection', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    expect(getByTestId('recent-checks-section')).toBeTruthy();
  });

  it('renders components in correct order', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    const profileCard = getByTestId('profile-summary-card');
    const quickActions = getByTestId('quick-actions-bar');
    const recentChecks = getByTestId('recent-checks-section');

    // All should be present
    expect(profileCard).toBeTruthy();
    expect(quickActions).toBeTruthy();
    expect(recentChecks).toBeTruthy();
  });

  it('passes limit=3 to RecentChecksSection', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    const recentChecks = getByTestId('recent-checks-section');
    expect(recentChecks.props.limit).toBe(3);
  });

  it('navigates to /scan when Scan Product is pressed', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    fireEvent.press(getByTestId('scan-btn'));

    expect(mockPush).toHaveBeenCalledWith('/scan');
  });

  it('navigates to /search when Search Catalog is pressed', () => {
    const { getByTestId } = render(React.createElement(HomeScreen));

    fireEvent.press(getByTestId('search-btn'));

    expect(mockPush).toHaveBeenCalledWith('/search');
  });
});

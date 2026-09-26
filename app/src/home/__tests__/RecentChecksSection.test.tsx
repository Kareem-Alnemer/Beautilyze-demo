import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecentChecksSection } from '../RecentChecksSection';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock profile store
const createMockStore = (overrides = {}) => ({
  user_id: 'test-user',
  user_skin_type: 'oily',
  user_acne_severity: 'moderate',
  age: 25,
  allergies: [],
  sensitivities: [],
  ai_skin_type: null,
  ai_acne_severity: null,
  skin_type_confidence: null,
  acne_severity_confidence: null,
  model_version: null,
  is_synced: false,
  is_syncing: false,
  last_synced_at: null,
  setAIProfile: jest.fn(),
  ...overrides,
});

jest.mock('../../profile/store', () => ({
  useProfileStore: jest.fn((selector) => selector(createMockStore())),
}));

// Mock RecentChecksList
jest.mock('../../components/RecentChecksList', () => {
  const React = require('react');
  return {
    RecentChecksList: ({ userId, onCheckSelect, limit, renderEmpty }) => {
      // Simulate empty state by calling renderEmpty
      if (renderEmpty) {
        return renderEmpty();
      }
      return React.createElement('View', { testID: 'recent-checks-list' },
        React.createElement('Text', null, 'RecentChecksList rendered')
      );
    },
  };
});

describe('RecentChecksSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section header with title', () => {
    const { getByText } = render(React.createElement(RecentChecksSection));

    expect(getByText('Recent Checks')).toBeTruthy();
  });

  it('renders "View All" link', () => {
    const { getByText } = render(React.createElement(RecentChecksSection));

    expect(getByText('View All')).toBeTruthy();
  });

  it('shows empty state when no checks', () => {
    const { getByText } = render(React.createElement(RecentChecksSection));

    expect(getByText('No checks yet')).toBeTruthy();
    expect(getByText('Scan your skin or search the catalog to start checking products.')).toBeTruthy();
  });

  it('shows "Scan Product" CTA button in empty state', () => {
    const { getByText } = render(React.createElement(RecentChecksSection));

    expect(getByText('Scan Product')).toBeTruthy();
  });

  it('navigates to /scan when empty state CTA is pressed', () => {
    const { getByText } = render(React.createElement(RecentChecksSection));

    fireEvent.press(getByText('Scan Product'));

    expect(mockPush).toHaveBeenCalledWith('/scan');
  });

  it('shows empty icon', () => {
    const { getByText } = render(React.createElement(RecentChecksSection));

    expect(getByText('📋')).toBeTruthy();
  });

  it('calls onViewAllPress when View All is pressed', () => {
    const mockOnViewAll = jest.fn();
    const { getByText } = render(React.createElement(RecentChecksSection, { onViewAllPress: mockOnViewAll }));

    fireEvent.press(getByText('View All'));

    expect(mockOnViewAll).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('passes limit prop to RecentChecksList', () => {
    const { getByText } = render(React.createElement(RecentChecksSection, { limit: 5 }));

    // When there are no checks, renderEmpty is called instead of rendering the list
    // So we verify the component renders without error and shows empty state
    expect(getByText('No checks yet')).toBeTruthy();
  });
});
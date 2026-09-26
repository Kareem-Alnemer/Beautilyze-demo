import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileSummaryCard } from '../ProfileSummaryCard';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock profile store with a factory that we can control
const createMockStore = (overrides = {}) => ({
  user_id: 'test-user',
  user_skin_type: 'oily',
  user_acne_severity: 'moderate',
  age: 25,
  allergies: ['fragrance', 'parabens'],
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
  ...overrides,
});

jest.mock('../../profile/store', () => ({
  useProfileStore: jest.fn((selector) => selector(createMockStore())),
}));

describe('ProfileSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all three cards with correct labels', () => {
    const { getByText } = render(React.createElement(ProfileSummaryCard));

    expect(getByText('SKIN TYPE')).toBeTruthy();
    expect(getByText('ACNE SEVERITY')).toBeTruthy();
    expect(getByText('ALLERGIES')).toBeTruthy();
  });

  it('shows user values when profile is set', () => {
    const { getByText } = render(React.createElement(ProfileSummaryCard));

    expect(getByText('Oily')).toBeTruthy();
    expect(getByText('Moderate')).toBeTruthy();
    expect(getByText('2')).toBeTruthy(); // 2 allergies
  });

  it('navigates to /profile when pressed', () => {
    const { getByTestId } = render(React.createElement(ProfileSummaryCard));

    fireEvent.press(getByTestId('profile-summary-card'));

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('calls onPress prop when provided', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(React.createElement(ProfileSummaryCard, { onPress: mockOnPress }));

    fireEvent.press(getByTestId('profile-summary-card'));

    expect(mockOnPress).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('has correct icons for each card', () => {
    const { getByText } = render(React.createElement(ProfileSummaryCard));

    expect(getByText('👤')).toBeTruthy();
    expect(getByText('🔍')).toBeTruthy();
    expect(getByText('⚠️')).toBeTruthy();
  });

  it('has accessibility label', () => {
    const { getByTestId } = render(React.createElement(ProfileSummaryCard));

    const container = getByTestId('profile-summary-card');
    expect(container.props.accessibilityLabel).toBe('View and edit your profile');
    expect(container.props.accessibilityRole).toBe('button');
  });
});
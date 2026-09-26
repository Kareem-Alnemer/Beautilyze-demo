import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingScreen } from '../OnboardingScreen';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

// Controllable store double
const mockOnboardingState: Record<string, unknown> = {
  user_id: null,
  user_skin_type: null,
  user_acne_severity: null,
  age: null,
  allergies: [],
  sensitivities: [],
  hasCompletedOnboarding: false,
  setUserSkinType: jest.fn(),
  setUserAcneSeverity: jest.fn(),
  setAge: jest.fn(),
  addAllergy: jest.fn(),
  removeAllergy: jest.fn(),
  addSensitivity: jest.fn(),
  removeSensitivity: jest.fn(),
  setHasCompletedOnboarding: jest.fn(() => Promise.resolve()),
  persistToSupabase: jest.fn(() => Promise.resolve()),
};

jest.mock('../../profile/store', () => {
  const mockUseProfileStore = jest.fn((selector: (s: unknown) => unknown) => selector(mockOnboardingState)) as unknown as {
    (...args: unknown[]): unknown;
    getState: jest.Mock;
  };
  mockUseProfileStore.getState = jest.fn(() => mockOnboardingState);
  return { useProfileStore: mockUseProfileStore };
});

// Mock primitives with test hooks
jest.mock('../../profile/components/SkinTypeSelector', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    SkinTypeSelector: ({ value, onChange, label }: Record<string, any>) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement('Text', null, label ?? 'Skin Type'),
        ['dry', 'normal', 'oily'].map((t) =>
          React.createElement(
            TouchableOpacity,
            { key: t, testID: `skin-type-${t}`, onPress: () => onChange(t) },
            React.createElement(Text, null, t + (value === t ? ' (selected)' : ''))
          )
        )
      ),
  };
});

jest.mock('../../profile/components/AcneSeveritySelector', () => {
  const React = require('react');
  return {
    AcneSeveritySelector: () => React.createElement('View', { testID: 'acne-severity-selector' }),
  };
});

jest.mock('../../profile/components/AgeInput', () => {
  const React = require('react');
  return {
    AgeInput: () => React.createElement('View', { testID: 'age-input' }),
  };
});

jest.mock('../../profile/components/AllergyManager', () => {
  const React = require('react');
  return {
    AllergyManager: () => React.createElement('View', { testID: 'allergy-manager' }),
  };
});

jest.mock('../../profile/components/SensitivityManager', () => {
  const React = require('react');
  return {
    SensitivityManager: () => React.createElement('View', { testID: 'sensitivity-manager' }),
  };
});

const resetState = (overrides: Record<string, unknown> = {}) => {
  Object.assign(mockOnboardingState, {
    user_id: null,
    user_skin_type: null,
    user_acne_severity: null,
    age: null,
    allergies: [],
    sensitivities: [],
    hasCompletedOnboarding: false,
  }, overrides);
  jest.clearAllMocks();
};

describe('OnboardingScreen', () => {
  beforeEach(() => resetState());

  it('renders header and all five sections', () => {
    const { getByText, getByTestId } = render(React.createElement(OnboardingScreen));

    expect(getByText('Welcome to BeautiLyze')).toBeTruthy();
    expect(getByText('Skin Type')).toBeTruthy();
    expect(getByTestId('acne-severity-selector')).toBeTruthy();
    expect(getByTestId('age-input')).toBeTruthy();
    expect(getByTestId('sensitivity-manager')).toBeTruthy();
    expect(getByTestId('allergy-manager')).toBeTruthy();
    expect(getByText('Get started')).toBeTruthy();
  });

  it('dims submit until skin type is chosen', () => {
    const { getByTestId } = render(React.createElement(OnboardingScreen));

    const style = getByTestId('onboarding-submit').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
    expect(flat.opacity).toBe(0.5);
  });

  it('forwards skin type selection to the store', () => {
    const { getByTestId } = render(React.createElement(OnboardingScreen));

    fireEvent.press(getByTestId('skin-type-oily'));

    expect(mockOnboardingState.setUserSkinType).toHaveBeenCalledWith('oily');
  });

  it('shows validation notice when submitted without skin type', () => {
    const { getByText } = render(React.createElement(OnboardingScreen));

    fireEvent.press(getByText('Get started'));

    expect(getByText('Choose your skin type to continue.')).toBeTruthy();
    expect(mockOnboardingState.setHasCompletedOnboarding).not.toHaveBeenCalled();
  });

  it('completes onboarding and navigates for a guest (no Supabase sync)', async () => {
    resetState({ user_skin_type: 'oily' });
    const { getByText } = render(React.createElement(OnboardingScreen));

    fireEvent.press(getByText('Get started'));

    await waitFor(() => {
      expect(mockOnboardingState.setHasCompletedOnboarding).toHaveBeenCalledWith(true);
    });
    expect(mockOnboardingState.persistToSupabase).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('syncs to Supabase when signed in', async () => {
    resetState({ user_id: 'user-1', user_skin_type: 'dry' });
    const { getByText } = render(React.createElement(OnboardingScreen));

    fireEvent.press(getByText('Get started'));

    await waitFor(() => {
      expect(mockOnboardingState.persistToSupabase).toHaveBeenCalled();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('shows a sync error but still navigates when the save fails', async () => {
    resetState({ user_id: 'user-1', user_skin_type: 'normal' });
    (mockOnboardingState.persistToSupabase as jest.Mock).mockRejectedValueOnce(new Error('Database unavailable'));
    const { getByText } = render(React.createElement(OnboardingScreen));

    fireEvent.press(getByText('Get started'));

    await waitFor(() => {
      expect(getByText("We couldn't save to your account. Your entries are kept on this device.")).toBeTruthy();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

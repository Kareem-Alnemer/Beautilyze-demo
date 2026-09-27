import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useProfileStore } from '../store';

// Mock the store
const mockStoreState = {
  user_id: 'owner' as string | null,
  user_skin_type: null,
  user_acne_severity: null,
  age: null,
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
};

jest.mock('../store', () => {
  const mockUseProfileStore = jest.fn((selector) => selector(mockStoreState)) as unknown as {
    (...args: unknown[]): unknown;
    getState: jest.Mock;
  };
  mockUseProfileStore.getState = jest.fn(() => mockStoreState);
  
  return {
    useProfileStore: mockUseProfileStore,
    selectUserSkinType: jest.fn((state) => state.user_skin_type),
    selectUserAcneSeverity: jest.fn((state) => state.user_acne_severity),
    selectAIProfile: jest.fn((state) => ({
      ai_skin_type: state.ai_skin_type,
      ai_acne_severity: state.ai_acne_severity,
      skin_type_confidence: state.skin_type_confidence,
      acne_severity_confidence: state.acne_severity_confidence,
      model_version: state.model_version,
    })),
    isAIHighConfidence: jest.fn((state, field) => {
      if (field === 'skin_type') return state.skin_type_confidence !== null && state.skin_type_confidence >= 0.60;
      return state.acne_severity_confidence !== null && state.acne_severity_confidence >= 0.60;
    }),
  };
});

// Mock components using simple React elements - use require('react') inside factory
jest.mock('../components/SkinTypeSelector', () => {
  const React = require('react');
  return {
    SkinTypeSelector: ({ value, onChange, label, disabled }: Record<string, any>) =>
      React.createElement('View', { testID: "skin-type-selector", accessibilityLabel: label },
        React.createElement('Text', { testID: "skin-type-label" }, label),
        React.createElement('Text', null, `${label}: ${value || 'Not set'}`),
        React.createElement('TouchableOpacity', { onPress: () => onChange('oily'), testID: "skin-type-oily" },
          React.createElement('Text', null, "Oily")
        ),
        React.createElement('TouchableOpacity', { onPress: () => onChange('dry'), testID: "skin-type-dry" },
          React.createElement('Text', null, "Dry")
        ),
        React.createElement('TouchableOpacity', { onPress: () => onChange('normal'), testID: "skin-type-normal" },
          React.createElement('Text', null, "Normal")
        )
      ),
  };
});

jest.mock('../components/AcneSeveritySelector', () => {
  const React = require('react');
  return {
    AcneSeveritySelector: ({ value, onChange, label, disabled }: Record<string, any>) =>
      React.createElement('View', { testID: "acne-severity-selector", accessibilityLabel: label },
        React.createElement('Text', { testID: "acne-severity-label" }, label),
        React.createElement('Text', null, `${label}: ${value || 'Not set'}`),
        React.createElement('TouchableOpacity', { onPress: () => onChange('moderate'), testID: "acne-moderate" },
          React.createElement('Text', null, "Moderate")
        ),
        React.createElement('TouchableOpacity', { onPress: () => onChange('mild'), testID: "acne-mild" },
          React.createElement('Text', null, "Mild")
        ),
        React.createElement('TouchableOpacity', { onPress: () => onChange('severe'), testID: "acne-severe" },
          React.createElement('Text', null, "Severe")
        )
      ),
  };
});

jest.mock('../components/AgeInput', () => {
  const React = require('react');
  return {
    AgeInput: ({ value, onChange, label, disabled }: Record<string, any>) =>
      React.createElement('View', { testID: "age-input", accessibilityLabel: label },
        React.createElement('Text', null, label),
        React.createElement('Text', null, `${label}: ${value || 'Not set'}`),
        React.createElement('TextInput', {
          testID: "age-text-input",
          value: value?.toString() || '',
          onChangeText: (text: string) => onChange(text ? parseInt(text, 10) : null),
          disabled: disabled,
        })
      ),
  };
});

jest.mock('../components/AllergyManager', () => {
  const React = require('react');
  return {
    AllergyManager: ({ items, onAdd, onRemove, disabled }: Record<string, any>) =>
      React.createElement('View', { testID: "allergy-manager" },
        React.createElement('Text', { testID: "allergies-label" }, "Allergies"),
        React.createElement('Text', null, `Allergies: ${items.join(', ') || 'None'}`),
        React.createElement('TouchableOpacity', { onPress: () => onAdd('peanut'), testID: "add-allergy" },
          React.createElement('Text', null, "Add Peanut")
        ),
        items.map((item: string) => (
          React.createElement('TouchableOpacity', { key: item, onPress: () => onRemove(item), testID: `remove-allergy-${item}` },
            React.createElement('Text', null, `Remove ${item}`)
          )
        ))
      ),
  };
});

jest.mock('../components/SensitivityManager', () => {
  const React = require('react');
  return {
    SensitivityManager: ({ items, onAdd, onRemove, disabled }: Record<string, any>) =>
      React.createElement('View', { testID: "sensitivity-manager" },
        React.createElement('Text', { testID: "sensitivities-label" }, "Sensitivities"),
        React.createElement('Text', null, `Sensitivities: ${items.join(', ') || 'None'}`),
        React.createElement('TouchableOpacity', { onPress: () => onAdd('fragrance'), testID: "add-sensitivity" },
          React.createElement('Text', null, "Add Fragrance")
        ),
        items.map((item: string) => (
          React.createElement('TouchableOpacity', { key: item, onPress: () => onRemove(item), testID: `remove-sensitivity-${item}` },
            React.createElement('Text', null, `Remove ${item}`)
          )
        ))
      ),
  };
});

jest.mock('../components/AIOverrideBanner', () => {
  const React = require('react');
  return {
    AIOverrideBanner: ({ field, aiValue, confidence, userValue, onAccept, onChange, modelVersion }: Record<string, any>) => {
      if (!aiValue) return null;
      const isHighConfidence = confidence !== null && confidence >= 0.60;
      return React.createElement('View', { testID: `ai-banner-${field}`, accessibilityLabel: `AI banner for ${field}` },
        React.createElement('Text', null, `AI ${field}: ${aiValue} (confidence: ${confidence})`),
        isHighConfidence && React.createElement('TouchableOpacity', { onPress: onAccept, testID: `accept-ai-${field}` },
          React.createElement('Text', null, "Accept")
        ),
        React.createElement('TouchableOpacity', { onPress: onChange, testID: `change-ai-${field}` },
          React.createElement('Text', null, "Change")
        ),
        !isHighConfidence && React.createElement('Text', { testID: `low-confidence-notice-${field}` }, 'The model was uncertain about this scan')
      );
    },
  };
});

describe('ProfileScreen', () => {
  const mockStore = {
    user_id: 'owner',
    user_skin_type: null,
    user_acne_severity: null,
    age: null,
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
    setUserSkinType: jest.fn(),
    setUserAcneSeverity: jest.fn(),
    setAge: jest.fn(),
    addAllergy: jest.fn(),
    removeAllergy: jest.fn(),
    addSensitivity: jest.fn(),
    removeSensitivity: jest.fn(),
    acceptAISkinType: jest.fn(),
    acceptAIAcneSeverity: jest.fn(),
    persistToSupabase: jest.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Update the mock store state
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
  });

  it('renders all sections', () => {
    const { getByText, getByTestId } = render(React.createElement(ProfileScreen));

    expect(getByText('Your Profile')).toBeTruthy();
    expect(getByText('Skin Type')).toBeTruthy();
    expect(getByText('Acne Severity')).toBeTruthy();
    expect(getByText('Age')).toBeTruthy();
    expect(getByText('Allergies')).toBeTruthy();
    expect(getByText('Sensitivities')).toBeTruthy();
    expect(getByText('Save Profile')).toBeTruthy();
  });

  it('renders AI override banner when AI data exists', () => {
    const storeWithAI = {
      ...mockStore,
      ai_skin_type: 'oily',
      skin_type_confidence: 0.75,
      ai_acne_severity: 'moderate',
      acne_severity_confidence: 0.68,
      model_version: 'test-model-v1',
    };
    Object.assign(mockStoreState, storeWithAI);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { getByTestId } = render(React.createElement(ProfileScreen));

    expect(getByTestId('ai-banner-skin_type')).toBeTruthy();
    expect(getByTestId('ai-banner-acne_severity')).toBeTruthy();
  });

  it('does not render AI banner when no AI data', () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { queryByTestId } = render(React.createElement(ProfileScreen));

    expect(queryByTestId('ai-banner-skin_type')).toBeNull();
    expect(queryByTestId('ai-banner-acne_severity')).toBeNull();
  });

  it('shows "Looks right" button when confidence >= 0.60', () => {
    const storeWithHighConfidence = {
      ...mockStore,
      ai_skin_type: 'oily',
      skin_type_confidence: 0.75,
    };
    Object.assign(mockStoreState, storeWithHighConfidence);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { getByTestId } = render(React.createElement(ProfileScreen));

    expect(getByTestId('accept-ai-skin_type')).toBeTruthy();
  });

  it('hides "Looks right" button when confidence < 0.60', () => {
    const storeWithLowConfidence = {
      ...mockStore,
      ai_skin_type: 'oily',
      skin_type_confidence: 0.45,
    };
    Object.assign(mockStoreState, storeWithLowConfidence);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { queryByTestId } = render(React.createElement(ProfileScreen));

    expect(queryByTestId('accept-ai-skin_type')).toBeNull();
  });

  it('shows low confidence notice when confidence < 0.60', () => {
    const storeWithLowConfidence = {
      ...mockStore,
      ai_skin_type: 'oily',
      skin_type_confidence: 0.45,
    };
    Object.assign(mockStoreState, storeWithLowConfidence);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { getByText } = render(React.createElement(ProfileScreen));

    expect(getByText('The model was uncertain about this scan')).toBeTruthy();
  });

  it('calls setUserSkinType when skin type selector changes', () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByTestId('skin-type-oily'));

    expect(mockStore.setUserSkinType).toHaveBeenCalledWith('oily');
  });

  it('calls setUserAcneSeverity when acne severity selector changes', () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByTestId('acne-moderate'));

    expect(mockStore.setUserAcneSeverity).toHaveBeenCalledWith('moderate');
  });

  it('calls setAge when age input changes', () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.changeText(getByTestId('age-text-input'), '25');

    expect(mockStore.setAge).toHaveBeenCalledWith(25);
  });

  it('calls addAllergy when adding allergy', () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByTestId('add-allergy'));

    expect(mockStore.addAllergy).toHaveBeenCalledWith('peanut');
  });

  it('calls removeAllergy when removing allergy', () => {
    const storeWithAllergy = {
      ...mockStore,
      allergies: ['peanut'],
    };
    Object.assign(mockStoreState, storeWithAllergy);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByTestId('remove-allergy-peanut'));

    expect(mockStore.removeAllergy).toHaveBeenCalledWith('peanut');
  });

  it('calls addSensitivity when adding sensitivity', () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByTestId('add-sensitivity'));

    expect(mockStore.addSensitivity).toHaveBeenCalledWith('fragrance');
  });

  it('calls acceptAISkinType when "Looks right" pressed', () => {
    const storeWithAI = {
      ...mockStore,
      ai_skin_type: 'oily',
      skin_type_confidence: 0.75,
    };
    Object.assign(mockStoreState, storeWithAI);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));

    const { getByTestId } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByTestId('accept-ai-skin_type'));

    expect(mockStore.acceptAISkinType).toHaveBeenCalled();
  });

  it('calls persistToSupabase when save button pressed', async () => {
    Object.assign(mockStoreState, mockStore);
    (useProfileStore as unknown as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
    const { getByText } = render(React.createElement(ProfileScreen));

    fireEvent.press(getByText('Save Profile'));

    await waitFor(() => {
      expect(mockStore.persistToSupabase).toHaveBeenCalled();
    });
  });

  it('shows a guest draft without pretending it can save to an account', () => {
    mockStoreState.user_id = null;
    const screen = render(<ProfileScreen />);
    expect(screen.getByText('Guest profile')).toBeTruthy();
    expect(screen.queryByText('Save Profile')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
  });

  it('announces a failed save and keeps the form available to retry', async () => {
    mockStore.persistToSupabase.mockRejectedValueOnce(new Error('offline'));
    const screen = render(<ProfileScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('Could not save your profile. Your changes are still available here.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save profile' }).props.accessibilityState.disabled).toBe(false);
  });
});

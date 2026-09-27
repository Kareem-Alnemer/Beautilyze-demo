/**
 * Tests for ScanScreen component.
 * Tests state machine transitions and profile hydration.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock expo-router (ScanScreen only uses useRouter for navigation)
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    Camera: jest.fn(({ children, ...props }: Record<string, any>) => React.createElement('View', { testID: 'camera-view', ...props }, children)),
    CameraView: jest.fn(({ children, ...props }: Record<string, any>) => React.createElement('View', { testID: 'camera-view', ...props }, children)),
    CameraType: {
      front: 'front',
      back: 'back',
    },
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

// Mock profile store
jest.mock('../../profile/store', () => ({
  useProfileStore: jest.fn((selector) => selector({
    user_id: 'test-user',
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
    setAIProfile: jest.fn(),
  })),
}));

// Mock factory for useScan - we'll control this via a module variable
let mockCurrentUseScanMock = {
  state: 'PERMISSIONS_REQUIRED',
  cameraPermission: 'undetermined',
  capturedUri: null,
  scanResult: null,
  error: null,
  isAnalyzing: false,
  skinTypeEvaluation: null,
  acneSeverityEvaluation: null,
  requestCameraPermission: jest.fn(),
  pickFromGallery: jest.fn(),
  analyzePhoto: jest.fn(),
  acceptAIInputs: jest.fn(),
  retakePhoto: jest.fn(),
  retryAnalysis: jest.fn(),
  dismissError: jest.fn(),
};

jest.mock('../hooks/useScan', () => ({
  useScan: () => mockCurrentUseScanMock,
}));

// Mock CameraViewport
jest.mock('../components/CameraViewport', () => {
  const React = require('react');
  return {
    CameraViewport: ({ onAnalyze, onGalleryPick, onPermissionGranted, permissionStatus, isCapturing }: Record<string, any>) =>
      React.createElement('View', { testID: 'camera-viewport' },
        React.createElement('Text', null, `CameraViewport: ${permissionStatus}`),
        React.createElement('TouchableOpacity', { testID: 'capture-btn', onPress: onAnalyze },
          React.createElement('Text', null, 'Capture')
        ),
        React.createElement('TouchableOpacity', { testID: 'gallery-btn', onPress: onGalleryPick },
          React.createElement('Text', null, 'Gallery')
        )
      ),
  };
});

// Mock AnalysisShimmer
jest.mock('../components/AnalysisShimmer', () => {
  const React = require('react');
  return {
    AnalysisShimmer: ({ message }: Record<string, any>) =>
      React.createElement('View', { testID: 'analysis-shimmer' },
        React.createElement('Text', null, message || 'Analyzing...')
      ),
  };
});

// Mock ScanResultView
jest.mock('../components/ScanResultView', () => {
  const React = require('react');
  return {
    ScanResultView: ({ result, skinTypeEval, acneSeverityEval, onAccept, onRetake, onSetManually }: Record<string, any>) =>
      React.createElement('View', { testID: 'scan-result-view' },
        React.createElement('Text', null, `Result: ${result?.skinType?.label}`),
        React.createElement('TouchableOpacity', { testID: 'accept-btn', onPress: onAccept },
          React.createElement('Text', null, 'Accept')
        ),
        React.createElement('TouchableOpacity', { testID: 'retake-btn', onPress: onRetake },
          React.createElement('Text', null, 'Retake')
        ),
        React.createElement('TouchableOpacity', { testID: 'manual-btn', onPress: onSetManually },
          React.createElement('Text', null, 'Set manually')
        )
      ),
  };
});

// Import after mocks
import { ScanScreen } from '../ScanScreen';

const createUseScanMock = (overrides = {}) => ({
  state: 'PERMISSIONS_REQUIRED',
  cameraPermission: 'undetermined',
  capturedUri: null,
  scanResult: null,
  error: null,
  isAnalyzing: false,
  skinTypeEvaluation: null,
  acneSeverityEvaluation: null,
  requestCameraPermission: jest.fn(),
  pickFromGallery: jest.fn(),
  analyzePhoto: jest.fn(),
  acceptAIInputs: jest.fn(),
  retakePhoto: jest.fn(),
  retryAnalysis: jest.fn(),
  dismissError: jest.fn(),
  ...overrides,
});

describe('ScanScreen', () => {
  it('reopens photo selection after an error when no image is retained', () => {
    const pick = jest.fn();
    mockCurrentUseScanMock = createUseScanMock({
      state: 'ERROR_RETRY', error: { message: 'Upload failed' }, pickFromGallery: pick,
    });
    const screen = render(<ScanScreen />);
    fireEvent.press(screen.getByLabelText('Choose photo again'));
    expect(pick).toHaveBeenCalledTimes(1);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUseScanMock = createUseScanMock();
  });

  it('renders permission screen when permission is undetermined', () => {
    const { getByText } = render(React.createElement(ScanScreen));

    expect(getByText('Camera Access Needed')).toBeTruthy();
    expect(getByText('Grant Camera Access')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('renders camera viewport when permission granted', () => {
    mockCurrentUseScanMock = createUseScanMock({
      state: 'CAMERA_ACTIVE',
      cameraPermission: 'granted',
    });

    const { getByTestId } = render(React.createElement(ScanScreen));

    expect(getByTestId('camera-viewport')).toBeTruthy();
  });

  it('shows analyzing state when analyzing', () => {
    mockCurrentUseScanMock = createUseScanMock({
      state: 'ANALYZING',
      cameraPermission: 'granted',
      capturedUri: 'file://test.jpg',
    });

    const { getByTestId } = render(React.createElement(ScanScreen));

    expect(getByTestId('analysis-shimmer')).toBeTruthy();
  });

  it('shows result review when analysis complete', () => {
    mockCurrentUseScanMock = createUseScanMock({
      state: 'RESULT_REVIEW',
      cameraPermission: 'granted',
      capturedUri: 'file://test.jpg',
      scanResult: {
        skinType: { label: 'oily', confidence: 0.75, model_version: 'test-v1' },
        acneSeverity: { label: 'moderate', confidence: 0.8, model_version: 'test-v1' },
        capturedUri: 'file://test.jpg',
        timestamp: Date.now(),
      },
      error: null,
      isAnalyzing: false,
      skinTypeEvaluation: {
        confidence: 0.75,
        isHighConfidence: true,
        actionLabel: 'Looks right',
        noticeText: undefined,
      },
      acneSeverityEvaluation: {
        confidence: 0.8,
        isHighConfidence: true,
        actionLabel: 'Looks right',
        noticeText: undefined,
      },
    });

    const { getByText } = render(React.createElement(ScanScreen));

    expect(getByText('Result: oily')).toBeTruthy();
  });

  it('shows error state with retry option', () => {
    mockCurrentUseScanMock = createUseScanMock({
      state: 'ERROR_RETRY',
      cameraPermission: 'granted',
      capturedUri: 'file://test.jpg',
      scanResult: null,
      error: { message: 'Network error', code: 'NETWORK_ERROR' },
      isAnalyzing: false,
      skinTypeEvaluation: null,
      acneSeverityEvaluation: null,
    });

    const { getByText } = render(React.createElement(ScanScreen));

    expect(getByText('Analysis Failed')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
    expect(getByText('Retake Photo')).toBeTruthy();
  });

  it('calls acceptAIInputs when accept button pressed', () => {
    const mockAccept = jest.fn();
    mockCurrentUseScanMock = createUseScanMock({
      state: 'RESULT_REVIEW',
      cameraPermission: 'granted',
      capturedUri: 'file://test.jpg',
      scanResult: {
        skinType: { label: 'oily', confidence: 0.75, model_version: 'test-v1' },
        acneSeverity: { label: 'moderate', confidence: 0.8, model_version: 'test-v1' },
        capturedUri: 'file://test.jpg',
        timestamp: Date.now(),
      },
      error: null,
      isAnalyzing: false,
      skinTypeEvaluation: {
        confidence: 0.75,
        isHighConfidence: true,
        actionLabel: 'Looks right',
        noticeText: undefined,
      },
      acneSeverityEvaluation: {
        confidence: 0.8,
        isHighConfidence: true,
        actionLabel: 'Looks right',
        noticeText: undefined,
      },
      acceptAIInputs: mockAccept,
    });

    const { getByText } = render(React.createElement(ScanScreen));

    fireEvent.press(getByText('Accept'));
    expect(mockAccept).toHaveBeenCalled();
  });

  it('calls retakePhoto when retake button pressed', () => {
    const mockRetake = jest.fn();
    mockCurrentUseScanMock = createUseScanMock({
      state: 'RESULT_REVIEW',
      cameraPermission: 'granted',
      capturedUri: 'file://test.jpg',
      scanResult: {
        skinType: { label: 'oily', confidence: 0.75, model_version: 'test-v1' },
        acneSeverity: { label: 'moderate', confidence: 0.8, model_version: 'test-v1' },
        capturedUri: 'file://test.jpg',
        timestamp: Date.now(),
      },
      error: null,
      isAnalyzing: false,
      skinTypeEvaluation: {
        confidence: 0.75,
        isHighConfidence: true,
        actionLabel: 'Looks right',
        noticeText: undefined,
      },
      acneSeverityEvaluation: {
        confidence: 0.8,
        isHighConfidence: true,
        actionLabel: 'Looks right',
        noticeText: undefined,
      },
      retakePhoto: mockRetake,
    });

    const { getByText } = render(React.createElement(ScanScreen));

    fireEvent.press(getByText('Retake'));
    expect(mockRetake).toHaveBeenCalled();
  });
});

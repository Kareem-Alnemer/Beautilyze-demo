/**
 * Tests for CameraViewport component.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CameraViewport } from '../components/CameraViewport';

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    Camera: jest.fn(({ children, ...props }) => React.createElement('View', { testID: 'camera-view', ...props }, children)),
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

import { Camera } from 'expo-camera';

describe('CameraViewport', () => {
  const mockOnAnalyze = jest.fn();
  const mockOnGalleryPick = jest.fn();
  const mockOnPermissionGranted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders permission prompt when permission is denied', () => {
    const { getByText } = render(
      React.createElement(CameraViewport, {
        onAnalyze: mockOnAnalyze,
        onGalleryPick: mockOnGalleryPick,
        onPermissionGranted: mockOnPermissionGranted,
        permissionStatus: 'denied',
        isCapturing: false,
      })
    );

    expect(getByText('Camera Permission Required')).toBeTruthy();
    expect(getByText('Grant Camera Permission')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('shows loading state when permission is undetermined', () => {
    const { getByText } = render(
      React.createElement(CameraViewport, {
        onAnalyze: mockOnAnalyze,
        onGalleryPick: mockOnGalleryPick,
        onPermissionGranted: mockOnPermissionGranted,
        permissionStatus: 'undetermined',
        isCapturing: false,
      })
    );

    expect(getByText('Requesting camera access...')).toBeTruthy();
  });

  it('renders camera view when permission is granted', () => {
    const { getByTestId } = render(
      React.createElement(CameraViewport, {
        onAnalyze: mockOnAnalyze,
        onGalleryPick: mockOnGalleryPick,
        onPermissionGranted: mockOnPermissionGranted,
        permissionStatus: 'granted',
        isCapturing: false,
      })
    );

    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('calls onGalleryPick when gallery button is pressed', () => {
    const { getByText } = render(
      React.createElement(CameraViewport, {
        onAnalyze: mockOnAnalyze,
        onGalleryPick: mockOnGalleryPick,
        onPermissionGranted: mockOnPermissionGranted,
        permissionStatus: 'denied',
        isCapturing: false,
      })
    );

    fireEvent.press(getByText('Choose from Gallery'));
    expect(mockOnGalleryPick).toHaveBeenCalled();
  });

  it('shows framing reticle text when permission granted', () => {
    const { getByText } = render(
      React.createElement(CameraViewport, {
        onAnalyze: mockOnAnalyze,
        onGalleryPick: mockOnGalleryPick,
        onPermissionGranted: mockOnPermissionGranted,
        permissionStatus: 'granted',
        isCapturing: false,
      })
    );

    expect(getByText('Position your face here')).toBeTruthy();
  });

  it('disables capture button when isCapturing is true', () => {
    const { getByTestId } = render(
      React.createElement(CameraViewport, {
        onAnalyze: mockOnAnalyze,
        onGalleryPick: mockOnGalleryPick,
        onPermissionGranted: mockOnPermissionGranted,
        permissionStatus: 'granted',
        isCapturing: true,
      })
    );

    const captureButton = getByTestId('capture-button');
    expect(captureButton.props.accessibilityState?.disabled).toBe(true);
  });
});
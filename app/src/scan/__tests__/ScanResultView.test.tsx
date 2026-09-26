/**
 * Tests for ScanResultView component.
 * Tests confidence thresholds, action buttons, and terminology compliance.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScanResultView } from '../components/ScanResultView';

describe('ScanResultView', () => {
  const baseResult = {
    skinType: { label: 'oily', confidence: 0.75, model_version: 'test-v1' },
    acneSeverity: { label: 'moderate', confidence: 0.8, model_version: 'test-v1' },
    capturedUri: 'file://test.jpg',
  };

  const baseSkinTypeEval = {
    confidence: 0.75,
    isHighConfidence: true,
    actionLabel: 'Looks right' as const,
    noticeText: undefined,
  };

  const baseAcneEval = {
    confidence: 0.8,
    isHighConfidence: true,
    actionLabel: 'Looks right' as const,
    noticeText: undefined,
  };

  const mockOnAccept = jest.fn();
  const mockOnRetake = jest.fn();
  const mockOnSetManually = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both predictions with labels and confidence', () => {
    const { getByText } = render(
      React.createElement(ScanResultView, {
        result: baseResult,
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    expect(getByText('Skin Type')).toBeTruthy();
    expect(getByText('Acne Severity')).toBeTruthy();
    expect(getByText('oily')).toBeTruthy();
    expect(getByText('moderate')).toBeTruthy();
  });

  it('shows "Looks right" button when confidence >= 0.60', () => {
    const { getAllByText } = render(
      React.createElement(ScanResultView, {
        result: baseResult,
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    const looksRightButtons = getAllByText('Looks right');
    expect(looksRightButtons.length).toBe(2); // One for skin type, one for acne
  });

  it('shows "Accept" button when confidence < 0.60', () => {
    const lowConfidenceEval = {
      confidence: 0.45,
      isHighConfidence: false,
      actionLabel: 'Accept' as const,
      noticeText: 'The model was uncertain about this scan',
    };

    const { getByText } = render(
      React.createElement(ScanResultView, {
        result: {
          ...baseResult,
          skinType: { label: 'oily', confidence: 0.45, model_version: 'test-v1' },
        },
        skinTypeEval: lowConfidenceEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    expect(getByText('Accept')).toBeTruthy();
    expect(getByText('The model was uncertain about this scan')).toBeTruthy();
  });

  it('shows "Set manually" button for both predictions', () => {
    const { getAllByText } = render(
      React.createElement(ScanResultView, {
        result: baseResult,
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    const setManuallyButtons = getAllByText('Set manually');
    expect(setManuallyButtons.length).toBe(2);
  });

  it('shows retake button', () => {
    const { getByText } = render(
      React.createElement(ScanResultView, {
        result: baseResult,
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    expect(getByText('Retake Photo')).toBeTruthy();
  });

  it('calls onAccept when "Looks right" is pressed', () => {
    const { getAllByText } = render(
      React.createElement(ScanResultView, {
        result: baseResult,
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    const looksRightButtons = getAllByText('Looks right');
    fireEvent.press(looksRightButtons[0]);
    expect(mockOnAccept).toHaveBeenCalled();
  });

  it('does not contain forbidden terminology', () => {
    const { queryByText, getAllByText } = render(
      React.createElement(ScanResultView, {
        result: {
          skinType: { label: 'oily', confidence: 0.75, model_version: 'test-v1' },
          acneSeverity: { label: 'moderate', confidence: 0.8, model_version: 'test-v1' },
          capturedUri: 'file://test.jpg',
        },
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    // Check forbidden terms per §10.2
    expect(queryByText(/safe/i)).toBeNull();
    expect(queryByText(/treatment/i)).toBeNull();
    expect(queryByText(/73% confident/i)).toBeNull();
    expect(queryByText(/diagnosed/i)).toBeNull();
    expect(queryByText(/cure/i)).toBeNull();

    // Check allowed terms - use getAllByText since there are multiple (one per prediction card)
    expect(getAllByText('Model score').length).toBeGreaterThan(0);
    expect(getAllByText('AI estimates').length).toBeGreaterThan(0);
  });

  it('shows model version info', () => {
    const { getByText } = render(
      React.createElement(ScanResultView, {
        result: {
          skinType: { label: 'oily', confidence: 0.75, model_version: 'test-v1' },
          acneSeverity: { label: 'moderate', confidence: 0.8, model_version: 'test-v1' },
          capturedUri: 'file://test.jpg',
        },
        skinTypeEval: baseSkinTypeEval,
        acneSeverityEval: baseAcneEval,
        onAccept: mockOnAccept,
        onRetake: mockOnRetake,
        onSetManually: mockOnSetManually,
      })
    );

    expect(getByText('Model: test-v1')).toBeTruthy();
  });
});
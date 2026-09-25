import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FactorBreakdownCard } from '../../components/FactorBreakdownCard';

describe('FactorBreakdownCard', () => {
  const baseFactor = {
    name: 'skin_type_fit',
    result: 'pass' as const,
    reason: 'Your skin type is oily; this product is tagged suitable for oily skin.',
  };

  it('renders factor name and result', () => {
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor: baseFactor, index: 0 }));

    expect(getByText('Skin-type fit')).toBeTruthy();
    expect(getByText('Pass')).toBeTruthy();
  });

  it('shows pass icon for pass result', () => {
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor: baseFactor, index: 0 }));

    expect(getByText('✓')).toBeTruthy();
  });

  it('shows caution icon for caution result', () => {
    const factor = { ...baseFactor, result: 'caution' as const, result: 'caution' };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    expect(getByText('⚠')).toBeTruthy();
    expect(getByText('Caution')).toBeTruthy();
  });

  it('shows fail icon for fail result', () => {
    const factor = { ...baseFactor, result: 'fail' as const };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    expect(getByText('✕')).toBeTruthy();
    expect(getByText('Mismatch')).toBeTruthy();
  });

  it('shows dash for insufficient_data', () => {
    const factor = { ...baseFactor, result: 'insufficient_data' as const };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    expect(getByText('—')).toBeTruthy();
    expect(getByText('Insufficient data')).toBeTruthy();
  });

  it('expands to show reason when tapped', () => {
    const { getByText, queryByText } = render(React.createElement(FactorBreakdownCard, { factor: baseFactor, index: 0 }));

    expect(queryByText('Your skin type is oily; this product is tagged suitable for oily skin.')).toBeNull();

    fireEvent.press(getByText('Skin-type fit'));

    expect(getByText('Your skin type is oily; this product is tagged suitable for oily skin.')).toBeTruthy();
  });

  it('collapses when tapped again', () => {
    const { getByText, queryByText } = render(React.createElement(FactorBreakdownCard, { factor: baseFactor, index: 0 }));

    fireEvent.press(getByText('Skin-type fit'));
    expect(getByText('Your skin type is oily; this product is tagged suitable for oily skin.')).toBeTruthy();

    fireEvent.press(getByText('Skin-type fit'));
    expect(queryByText('Your skin type is oily; this product is tagged suitable for oily skin.')).toBeNull();
  });

  it('renders acne_fit with correct label', () => {
    const factor = { name: 'acne_fit', result: 'pass' as const, reason: 'Test' };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 1 }));

    expect(getByText('Acne-concern fit')).toBeTruthy();
  });

  it('renders age_fit with correct label', () => {
    const factor = { name: 'age_fit', result: 'pass' as const, reason: 'Test' };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 2 }));

    expect(getByText('Age fit')).toBeTruthy();
  });

  it('limits reason to 2 lines', () => {
    const longReason = 'This is a very long reason that should be truncated to two lines maximum when displayed in the factor breakdown card.';
    const factor = { ...baseFactor, reason: longReason };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    fireEvent.press(getByText('Skin-type fit'));

    const reasonText = getByText(longReason);
    expect(reasonText.props.numberOfLines).toBe(2);
  });
});
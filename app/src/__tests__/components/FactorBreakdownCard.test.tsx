import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FactorBreakdownCard } from '../../components/FactorBreakdownCard';
import type { FactorResult } from '../../verdict/types';
import { Icon } from '../../components/ui/Icon';

describe('FactorBreakdownCard', () => {
  const baseFactor: FactorResult = {
    name: 'skin_type_fit',
    result: 'pass',
    reason: 'Your skin type is oily; this product is tagged suitable for oily skin.',
  };

  it('renders factor name and result', () => {
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor: baseFactor, index: 0 }));

    expect(getByText('Skin-type fit')).toBeTruthy();
    expect(getByText('Pass')).toBeTruthy();
  });

  it('shows pass icon for pass result', () => {
    const screen = render(React.createElement(FactorBreakdownCard, { factor: baseFactor, index: 0 }));
    expect(screen.UNSAFE_getAllByType(Icon)[0].props.name).toBe('check');
  });

  it('shows caution icon for caution result', () => {
    const factor = { ...baseFactor, result: 'caution' as const };
    const { getByText, UNSAFE_getAllByType } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    expect(UNSAFE_getAllByType(Icon)[0].props.name).toBe('alert-triangle');
    expect(getByText('Caution')).toBeTruthy();
  });

  it('shows fail icon for fail result', () => {
    const factor = { ...baseFactor, result: 'fail' as const };
    const { getByText, UNSAFE_getAllByType } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    expect(UNSAFE_getAllByType(Icon)[0].props.name).toBe('x');
    expect(getByText('Mismatch')).toBeTruthy();
  });

  it('shows an information icon for insufficient_data', () => {
    const factor = { ...baseFactor, result: 'insufficient_data' as const };
    const { getByText, UNSAFE_getAllByType } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    expect(UNSAFE_getAllByType(Icon)[0].props.name).toBe('info');
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
    const factor: FactorResult = { name: 'acne_fit', result: 'pass', reason: 'Test' };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 1 }));

    expect(getByText('Acne-concern fit')).toBeTruthy();
  });

  it('renders age_fit with correct label', () => {
    const factor: FactorResult = { name: 'age_fit', result: 'pass', reason: 'Test' };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 2 }));

    expect(getByText('Age fit')).toBeTruthy();
  });

  it('does not truncate the expanded explanation on narrow screens', () => {
    const longReason = 'This is a very long reason that should be truncated to two lines maximum when displayed in the factor breakdown card.';
    const factor = { ...baseFactor, reason: longReason };
    const { getByText } = render(React.createElement(FactorBreakdownCard, { factor, index: 0 }));

    fireEvent.press(getByText('Skin-type fit'));

    const reasonText = getByText(longReason);
    expect(reasonText.props.numberOfLines).toBeUndefined();
  });
});

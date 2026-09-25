import React from 'react';
import { render } from '@testing-library/react-native';
import { ScoreLine } from '../../components/ScoreLine';

describe('ScoreLine', () => {
  it('renders compatibility factors matched count', () => {
    const { getByText } = render(
      React.createElement(ScoreLine, {
        score: { label: 'Compatibility factors', passed: 2, total: 3 },
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'pass', reason: '' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(getByText('2 of 3 compatibility factors matched.')).toBeTruthy();
  });

  it('shows hard constraint flagged when any constraint is not pass', () => {
    const { getByText } = render(
      React.createElement(ScoreLine, {
        score: { label: 'Compatibility factors', passed: 2, total: 3 },
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'fail', reason: 'Contains peanut' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(getByText('2 of 3 compatibility factors matched.')).toBeTruthy();
    expect(getByText('1 hard constraint flagged.')).toBeTruthy();
  });

  it('shows plural hard constraints flagged when multiple', () => {
    const { getByText } = render(
      React.createElement(ScoreLine, {
        score: { label: 'Compatibility factors', passed: 1, total: 3 },
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'fail', reason: 'Contains peanut' },
          { name: 'sensitivity', result: 'caution', reason: 'Contains fragrance' },
        ],
      })
    );

    expect(getByText('2 hard constraints flagged.')).toBeTruthy();
  });

  it('does not show hard constraint line when all pass', () => {
    const { queryByText } = render(
      React.createElement(ScoreLine, {
        score: { label: 'Compatibility factors', passed: 3, total: 3 },
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'pass', reason: '' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(queryByText(/hard constraint/)).toBeNull();
  });

  it('handles insufficient_data as flagged', () => {
    const { getByText } = render(
      React.createElement(ScoreLine, {
        score: { label: 'Compatibility factors', passed: 2, total: 3 },
        hardConstraints: [
          { name: 'declared_allergen_conflict', result: 'insufficient_data', reason: 'Incomplete ingredients' },
          { name: 'sensitivity', result: 'pass', reason: '' },
        ],
      })
    );

    expect(getByText('1 hard constraint flagged.')).toBeTruthy();
  });
});